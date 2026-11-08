// Notes FS: save note (atomic .md then .json + history snapshot) [笔记文件系统 - 保存笔记 (原子写 .md 后 .json + 历史快照)]

import * as fs from 'fs-extra';
import * as path from 'path';
import { ensureNotesDir, isValidNoteId } from 'sparklet/main/services/note/io/note-paths.js';
import { writeFileAtomic } from 'sparklet/main/services/note/io/note-io.js';
import { maybeSnapshotOnSave } from 'sparklet/main/services/note/io/note-history.js';
import { withNoteLock } from 'sparklet/main/services/note/io/note-write-lock.js';
import type { Note, NoteMeta, NoteSaveResult } from 'sparklet/shared/types/note/notes.js';

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
