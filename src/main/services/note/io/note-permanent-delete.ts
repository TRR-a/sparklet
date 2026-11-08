// Notes FS: permanent delete (files + history) [笔记文件系统 - 永久删除 (文件+历史)]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getNotesDir, isValidNoteId } from 'sparklet/main/services/note/io/note-paths.js';
import { withNoteLock } from 'sparklet/main/services/note/io/note-write-lock.js';
import { removeHistory } from 'sparklet/main/services/note/io/note-history.js';
import type { NoteOperationResult } from 'sparklet/shared/types/note/notes.js';

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
