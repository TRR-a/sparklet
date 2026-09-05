// Note history - version snapshots under notes/.history/{id}/ [笔记历史 - notes/.history/{id}/ 下的版本快照]
//
// Snapshot policy [快照策略]：
//   - maybeSnapshotOnSave: at most one snapshot per note per 10 minutes of saving
//     (in-memory map; a process restart re-baselines on first save)
//     [保存时每笔记最多每 10 分钟快照一次 (内存映射；进程重启后首次保存重建基线)]
//   - snapshotNote: unconditional snapshot (used before delete / restore)
//     [无条件快照 (删除/恢复前调用)]
//   - Pruned to MAX_SNAPSHOTS_PER_NOTE (oldest first) [每笔记最多保留 N 张，超出修剪最旧的]
//
// Snapshot files are full copies (title + content + meta) named {ms}-{rand}.json
// [快照文件为全量拷贝 (标题+正文+元数据)，文件名 {ms}-{rand}.json]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getNoteHistoryDir, isValidNoteId, isValidSnapshotTs } from './note-paths';
import type { Note, NoteHistoryEntry, NoteHistoryResult, NoteSnapshot, NoteSnapshotResult } from '../../shared/types/notes';

/** Minimum interval between snapshots of the same note [同一笔记两次快照的最小间隔] */
const SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000;

/** Max snapshots kept per note [每笔记保留的快照上限] */
const MAX_SNAPSHOTS_PER_NOTE = 20;

/** In-memory last snapshot time per note (session-scoped) [每笔记最近快照时间 (会话级)] */
const lastSnapshotAt = new Map<string, number>();

/**
 * Generate a snapshot ts token: ms timestamp + 3-digit random suffix
 * [生成快照令牌：毫秒时间戳 + 3 位随机后缀 (文件名安全且可按名称排序)]
 */
function makeTsToken(): string {
  return `${Date.now()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
}

/**
 * List snapshot files of a note, newest first (by ts token, ms-prefixed names sort naturally)
 * [列出某笔记的快照文件，按令牌降序 (毫秒前缀文件名天然可排序)]
 */
async function listSnapshotTs(id: string): Promise<string[]> {
  const dir = getNoteHistoryDir(id);
  if (!(await fs.pathExists(dir))) return [];
  const files = await fs.readdir(dir);
  return files
    .filter(f => f.endsWith('.json') && isValidSnapshotTs(f.replace('.json', '')))
    .map(f => f.replace('.json', ''))
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

/**
 * Write a full snapshot of the note and prune old ones [写入全量快照并修剪旧快照]
 */
export async function snapshotNote(note: Note): Promise<string> {
  const ts = makeTsToken();
  const snapshot: NoteSnapshot = { ts, savedAt: new Date().toISOString(), note };
  const dir = getNoteHistoryDir(note.id);
  await fs.ensureDir(dir);
  await fs.writeJson(path.join(dir, `${ts}.json`), snapshot, { spaces: 2 });
  lastSnapshotAt.set(note.id, Date.now());

  // Prune oldest beyond the cap [超出上限时修剪最旧的]
  const all = await listSnapshotTs(note.id);
  if (all.length > MAX_SNAPSHOTS_PER_NOTE) {
    for (const old of all.slice(MAX_SNAPSHOTS_PER_NOTE)) {
      try { await fs.remove(path.join(dir, `${old}.json`)); } catch { /* ignore [忽略] */ }
    }
  }
  return ts;
}

/**
 * Take a snapshot only if the interval elapsed since the last one (called on every save)
 * [仅当距上次快照超过间隔时才快照 (每次保存时调用)]
 */
export async function maybeSnapshotOnSave(note: Note): Promise<void> {
  const last = lastSnapshotAt.get(note.id) ?? 0;
  if (Date.now() - last < SNAPSHOT_INTERVAL_MS) return;
  await snapshotNote(note);
}

/**
 * List history entries of a note (newest first, without content)
 * [列出笔记历史条目 (按时间降序，不含正文)]
 */
export async function listHistory(id: string): Promise<NoteHistoryResult> {
  try {
    if (!isValidNoteId(id)) throw new Error('Invalid note ID');
    const dir = getNoteHistoryDir(id);
    if (!(await fs.pathExists(dir))) return { success: true, entries: [] };

    const entries: NoteHistoryEntry[] = [];
    for (const ts of await listSnapshotTs(id)) {
      try {
        const snapshot = await fs.readJson(path.join(dir, `${ts}.json`)) as NoteSnapshot;
        entries.push({
          ts,
          savedAt: snapshot.savedAt,
          title: snapshot.note?.title || '',
          charCount: snapshot.note?.content ? snapshot.note.content.length : 0
        });
      } catch {
        // Skip unreadable snapshot files (torn write of a snapshot is not fatal)
        // [跳过无法读取的快照文件 (快照本身写坏不致命)]
      }
    }
    return { success: true, entries };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NoteHistory] list error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Read one snapshot [读取一份快照]
 */
export async function getSnapshot(id: string, ts: string): Promise<NoteSnapshotResult> {
  try {
    if (!isValidNoteId(id)) throw new Error('Invalid note ID');
    if (!isValidSnapshotTs(ts)) throw new Error('Invalid snapshot token');
    const file = path.join(getNoteHistoryDir(id), `${ts}.json`);
    const snapshot = await fs.readJson(file) as NoteSnapshot;
    if (!snapshot || !snapshot.note || !snapshot.note.id) throw new Error('Malformed snapshot');
    return { success: true, snapshot };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NoteHistory] get error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get the newest snapshot of a note (used by integrity repair) [获取某笔记最新快照 (完整性修复用)]
 */
export async function getLatestSnapshot(id: string): Promise<NoteSnapshot | null> {
  try {
    const tokens = await listSnapshotTs(id);
    if (tokens.length === 0) return null;
    const result = await getSnapshot(id, tokens[0]);
    return result.success && result.snapshot ? result.snapshot : null;
  } catch {
    return null;
  }
}

/**
 * Remove all history of a note (on permanent delete) [移除某笔记的全部历史 (永久删除时)]
 */
export async function removeHistory(id: string): Promise<void> {
  try {
    const dir = getNoteHistoryDir(id);
    if (await fs.pathExists(dir)) await fs.remove(dir);
    lastSnapshotAt.delete(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[NoteHistory] remove failed for ${id}:`, msg);
  }
}
