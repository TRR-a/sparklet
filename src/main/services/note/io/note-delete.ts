// Notes FS: soft delete (move to trash) [笔记文件系统 - 软删除 (移入回收站)]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getNotesDir, isValidNoteId } from 'sparklet/main/services/note/io/note-paths.js';
import { writeFileAtomic } from 'sparklet/main/services/note/io/note-io.js';
import { snapshotNote } from 'sparklet/main/services/note/io/note-history.js';
import { withNoteLock } from 'sparklet/main/services/note/io/note-write-lock.js';
import { getNote } from 'sparklet/main/services/note/io/note-read.js';
import type { NoteMeta, NoteOperationResult } from 'sparklet/shared/types/note/notes.js';

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
