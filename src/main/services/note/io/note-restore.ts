// Notes FS: restore soft-deleted note [笔记文件系统 - 恢复软删除笔记]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getNotesDir, isValidNoteId } from './note-paths.js';
import { writeFileAtomic } from './note-io.js';
import { withNoteLock } from './note-write-lock.js';
import type { NoteMeta, NoteOperationResult } from 'sparklet/shared/types/note/notes.js';

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
