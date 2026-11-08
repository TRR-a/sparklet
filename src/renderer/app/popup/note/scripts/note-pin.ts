// Note action: toggle pinned [笔记操作 - 切换置顶]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { refreshNoteListView } from 'sparklet/renderer/app/popup/note/list/scripts/note-search.js';

/**
 * Toggle note pinned state [切换笔记置顶状态]
 */
export async function togglePinNote(noteId: string): Promise<void> {
  const note = await storageManager.getNoteById(noteId);
  if (!note) return;
  const newPinned = !note.pinned;
  await storageManager.updateNote(noteId, { pinned: newPinned });
  await refreshNoteListView();
}
