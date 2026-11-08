// Notes FS: read a single note (meta + content) [笔记文件系统 - 读取单篇笔记 (元数据+正文)]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getNotesDir, isValidNoteId } from './note-paths.js';
import type { Note, NoteGetResult } from 'sparklet/shared/types/note/notes.js';

/**
 * Get a single note (with content) [获取单篇笔记 (含 content)]
 */
export async function getNote(id: string): Promise<NoteGetResult> {
  try {
    if (!id || !isValidNoteId(id)) throw new Error('Note ID required');
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);
    const mdPath = path.join(notesDir, `${id}.md`);

    const meta = await fs.readJson(jsonPath) as Note;
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
