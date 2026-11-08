// Note action: toggle starred [笔记操作 - 切换星标]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { refreshNoteListView } from 'sparklet/renderer/app/popup/note/list/scripts/note-search.js';

/**
 * Toggle note starred state [切换笔记星标状态]
 */
export async function toggleStarNote(noteId: string): Promise<void> {
  const note = await storageManager.getNoteById(noteId);
  if (!note) return;
  const newStarred = !note.starred;
  await storageManager.updateNote(noteId, { starred: newStarred });
  await refreshNoteListView();
}
