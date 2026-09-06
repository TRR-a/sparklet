// Notes file system storage service [笔记文件系统存储服务]
// Each note is stored independently as .json (metadata) + .md (content) [每个笔记独立存储为 .json (元数据) + .md (正文)]
//
// Crash safety [崩溃安全]：
//   - All writes are atomic (temp + rename, see note-io.ts) [所有写入均为原子写 (临时文件+重命名)]
//   - saveNote writes .md before .json so a crash between the two keeps the
//     valuable content file newer than its metadata [先写 .md 后写 .json，两步之间崩溃时正文不会比元数据旧]
//   - Saves trigger throttled history snapshots; deletes snapshot first
//     [保存触发限频历史快照；删除前先快照]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getNotesDir, ensureNotesDir, isValidNoteId } from './note-paths';
import { writeFileAtomic } from './note-io';
import { maybeSnapshotOnSave, snapshotNote, removeHistory } from './note-history';
import type { Note, NoteMeta, NoteListResult, NoteGetResult, NoteSaveResult, NoteOperationResult, NoteSearchResult } from '../../shared/types/notes';

/** Old note format from electron-store (before migration) [旧 electron-store 中的笔记格式 (迁移前)] */
interface OldNote {
  id?: string;
  title?: string;
  content?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  pinned?: boolean;
  starred?: boolean;
}

/** Partial note metadata (without content) [部分笔记元数据 (不含 content)] */
type NoteMetaPartial = Partial<NoteMeta>;

/**
 * Per-note write serialization: save/delete IPC handlers run concurrently in the
 * main process; without a lock, a save's readJson can happen before a delete's
 * write and its writeFile after, reverting isDeleted to false (resurrecting a
 * trashed note) [同笔记写操作串行锁：IPC 处理器在主进程并发执行，保存的读与写若
 * 夹住删除的写，会把 isDeleted 覆盖回 false 导致已删除笔记复活]
 */
const noteWriteLocks = new Map<string, Promise<unknown>>();

function withNoteLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const prev = noteWriteLocks.get(id) ?? Promise.resolve();
  const run = prev.then(fn, fn); // fn ignores the previous outcome [fn 不关心前序结果]
  noteWriteLocks.set(id, run);
  const release = () => {
    if (noteWriteLocks.get(id) === run) noteWriteLocks.delete(id);
  };
  run.then(release, release);
  return run;
}

/**
 * Get notes directory path [获取笔记目录路径]
 */
export { getNotesDir, ensureNotesDir } from './note-paths';

/**
 * List all notes (without content) [列出所有笔记 (不含 content)]
 */
export async function listNotes(): Promise<NoteListResult> {
  try {
    const notesDir = await ensureNotesDir();
    const files = await fs.readdir(notesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const notes: NoteMetaPartial[] = [];
    // Parallel read: serial await-per-file made list/deletes lag 1-2s with many notes [并行读取：串行逐文件 await 会在笔记多时导致列表/删除卡顿 1-2 秒]
    const metas = await Promise.all(jsonFiles.map(async (file) => {
      const id = file.replace('.json', '');
      const jsonPath = path.join(notesDir, file);
      try {
        const meta = await fs.readJson(jsonPath) as NoteMetaPartial;
        if (!meta.id) meta.id = id;
        return meta;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[NotesFS] Skip invalid json: ${file}`, msg);
        return null;
      }
    }));
    for (const meta of metas) {
      if (meta) notes.push(meta);
    }

    notes.sort((a, b) => {
      // Pinned first, then starred, then by updatedAt descending [置顶优先，然后星标，然后按更新时间降序]
      const aPinned = a.pinned ? 2 : 0;
      const bPinned = b.pinned ? 2 : 0;
      const aStarred = a.starred ? 1 : 0;
      const bStarred = b.starred ? 1 : 0;
      const aRank = aPinned + aStarred;
      const bRank = bPinned + bStarred;
      if (aRank !== bRank) return bRank - aRank;
      const aTime = new Date(a.updatedAt || 0).getTime();
      const bTime = new Date(b.updatedAt || 0).getTime();
      return bTime - aTime;
    });
    return { success: true, notes: notes as NoteMeta[] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] list error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get a single note (with content) [获取单篇笔记 (含 content)]
 */
export async function getNote(id: string): Promise<NoteGetResult> {
  try {
    if (!id || !isValidNoteId(id)) throw new Error('Note ID required');
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);
    const mdPath = path.join(notesDir, `${id}.md`);

    const meta = await fs.readJson(jsonPath) as NoteMeta;
    let content = '';
    try {
      content = await fs.readFile(mdPath, 'utf8');
    } catch {
      console.warn(`[NotesFS] .md missing for ${id}, treating as empty.`);
    }

    return { success: true, note: { ...meta, content } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] get error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Save a note (create or update) [保存笔记 (新建或更新)]
 * Atomic writes: .md first, then .json (content is the valuable artifact) [原子写入：先 .md 后 .json (正文是关键资产)]
 */
export async function saveNote(noteData: Note): Promise<NoteSaveResult> {
  if (!noteData || !noteData.id || !isValidNoteId(noteData.id)) {
    return { success: false, error: 'Invalid note data' };
  }
  return withNoteLock(noteData.id, () => saveNoteLocked(noteData));
}

/** Locked save body [加锁的保存实现] */
async function saveNoteLocked(noteData: Note): Promise<NoteSaveResult> {
  try {
    const notesDir = await ensureNotesDir();

    // Guard: never save over a soft-deleted note (a save arriving after a delete
    // would revert isDeleted to false and resurrect it) [保护：不得覆盖已软删除
    // 的笔记 (删除之后到达的保存会把 isDeleted 改回 false 导致复活)]
    const jsonPath = path.join(notesDir, `${noteData.id}.json`);
    if (await fs.pathExists(jsonPath)) {
      const existing = await fs.readJson(jsonPath) as Partial<NoteMeta>;
      if (existing.isDeleted && !noteData.isDeleted) {
        return { success: false, error: 'Note is deleted' };
      }
    }

    const { content, ...meta } = noteData;

    const mdPath = path.join(notesDir, `${noteData.id}.md`);
    await writeFileAtomic(mdPath, content || '');

    await writeFileAtomic(jsonPath, JSON.stringify(meta, null, 2));

    // Throttled history snapshot (failure must never break the save) [限频历史快照 (失败不影响保存)]
    try {
      await maybeSnapshotOnSave(noteData);
    } catch (err) {
      console.warn('[NotesFS] history snapshot failed:', err);
    }

    return { success: true, note: noteData };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] save error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Full-text search across title + content (case-insensitive) [全文搜索标题与正文 (忽略大小写)]
 * Returns non-deleted notes matching the query, sorted by the same rank as listNotes [返回匹配的未删除笔记，排序与 listNotes 一致]
 */
export async function searchNotes(query: string): Promise<NoteSearchResult> {
  try {
    const q = (query || '').trim().toLowerCase();
    if (!q) return { success: true, notes: [] };

    const notesDir = await ensureNotesDir();
    const files = await fs.readdir(notesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const notes: NoteMeta[] = [];
    for (const file of jsonFiles) {
      const id = file.replace('.json', '');
      const jsonPath = path.join(notesDir, file);
      try {
        const meta = await fs.readJson(jsonPath) as Partial<NoteMeta>;
        if (!meta.id) meta.id = id;
        if (meta.isDeleted) continue;

        let content = '';
        try {
          content = await fs.readFile(path.join(notesDir, `${id}.md`), 'utf8');
        } catch {
          content = ''; // Missing .md treated as empty [.md 缺失视为空]
        }

        const title = meta.title || '';
        if (title.toLowerCase().includes(q) || content.toLowerCase().includes(q)) {
          notes.push(meta as NoteMeta);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[NotesFS] search skip invalid json: ${file}`, msg);
      }
    }

    // Same rank as listNotes: pinned > starred > updatedAt desc [与 listNotes 相同的排序：置顶 > 星标 > 更新时间降序]
    notes.sort((a, b) => {
      const aRank = (a.pinned ? 2 : 0) + (a.starred ? 1 : 0);
      const bRank = (b.pinned ? 2 : 0) + (b.starred ? 1 : 0);
      if (aRank !== bRank) return bRank - aRank;
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
    return { success: true, notes };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] search error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Soft delete (move to trash) [软删除 (移入回收站)]
 * Snapshots the full note first so pre-delete content stays recoverable [先全量快照，删除前内容可恢复]
 */
export async function deleteNote(id: string): Promise<NoteOperationResult> {
  if (!id || !isValidNoteId(id)) return { success: false, error: 'Note ID required' };
  return withNoteLock(id, () => deleteNoteLocked(id));
}

/** Locked delete body [加锁的删除实现] */
async function deleteNoteLocked(id: string): Promise<NoteOperationResult> {
  try {
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);

    // Snapshot pre-delete state (best-effort) [删除前快照 (尽力而为)]
    try {
      const note = await getNote(id);
      if (note.success && note.note) await snapshotNote(note.note);
    } catch (err) {
      console.warn('[NotesFS] pre-delete snapshot failed:', err);
    }

    const meta = await fs.readJson(jsonPath) as NoteMeta;
    meta.isDeleted = true;
    meta.deletedAt = new Date().toISOString();
    await writeFileAtomic(jsonPath, JSON.stringify(meta, null, 2));

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] delete error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Restore soft-deleted note [恢复软删除]
 */
export async function restoreNote(id: string): Promise<NoteOperationResult> {
  if (!id || !isValidNoteId(id)) return { success: false, error: 'Note ID required' };
  return withNoteLock(id, () => restoreNoteLocked(id));
}

/** Locked restore body [加锁的恢复实现] */
async function restoreNoteLocked(id: string): Promise<NoteOperationResult> {
  try {
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);

    const meta = await fs.readJson(jsonPath) as NoteMeta;
    meta.isDeleted = false;
    meta.deletedAt = null;
    await writeFileAtomic(jsonPath, JSON.stringify(meta, null, 2));

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] restore error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Permanently delete (physically remove .json + .md + history) [永久删除 (物理删除 .json + .md + 历史)]
 */
export async function permanentDeleteNote(id: string): Promise<NoteOperationResult> {
  if (!id || !isValidNoteId(id)) return { success: false, error: 'Note ID required' };
  return withNoteLock(id, () => permanentDeleteNoteLocked(id));
}

/** Locked permanent-delete body [加锁的永久删除实现] */
async function permanentDeleteNoteLocked(id: string): Promise<NoteOperationResult> {
  try {
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);
    const mdPath = path.join(notesDir, `${id}.md`);

    if (await fs.pathExists(jsonPath)) await fs.remove(jsonPath);
    if (await fs.pathExists(mdPath)) await fs.remove(mdPath);
    await removeHistory(id);

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] permanentDelete error:', msg);
    return { success: false, error: msg };
  }
}

export type { OldNote };
