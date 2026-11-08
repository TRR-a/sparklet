// Notes FS: full-text search (title + content) [笔记文件系统 - 全文搜索 (标题+正文)]

import * as fs from 'fs-extra';
import * as path from 'path';
import { ensureNotesDir } from 'sparklet/main/services/note/io/note-paths.js';
import { compareNotes } from 'sparklet/main/services/note/io/note-sort.js';
import type { NoteMeta, NoteSearchResult } from 'sparklet/shared/types/note/notes.js';

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
    notes.sort(compareNotes);
    return { success: true, notes };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] search error:', msg);
    return { success: false, error: msg };
  }
}
