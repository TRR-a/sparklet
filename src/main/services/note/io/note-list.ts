// Notes FS: list notes (metadata only, parallel read) [笔记文件系统 - 列出笔记 (仅元数据，并行读取)]

import * as fs from 'fs-extra';
import * as path from 'path';
import { ensureNotesDir } from './note-paths.js';
import { compareNotes } from './note-sort.js';
import type { NoteMeta, NoteListResult } from 'sparklet/shared/types/note/notes.js';

/** Partial note metadata (without content) [部分笔记元数据 (不含 content)] */
type NoteMetaPartial = Partial<NoteMeta>;

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

    notes.sort(compareNotes);
    return { success: true, notes: notes as NoteMeta[] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] list error:', msg);
    return { success: false, error: msg };
  }
}
