// Note history: list snapshots [笔记历史 - 列出快照]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getNoteHistoryDir, isValidNoteId } from '../io/note-paths.js';
import { listSnapshotTs } from './note-history-store.js';
import type { NoteHistoryEntry, NoteHistoryResult, NoteSnapshot } from 'sparklet/shared/types/note/notes.js';

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
