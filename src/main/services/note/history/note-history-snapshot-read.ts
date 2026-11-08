// Note history: read one snapshot [笔记历史 - 读取单份快照]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getNoteHistoryDir, isValidNoteId, isValidSnapshotTs } from 'sparklet/main/services/note/io/note-paths.js';
import type { NoteSnapshot, NoteSnapshotResult } from 'sparklet/shared/types/note/notes.js';

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
