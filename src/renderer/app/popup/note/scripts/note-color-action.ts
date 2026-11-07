// Note action: change color [笔记操作 - 更改颜色]

import storageManager from 'sparklet/renderer/shared/storage/storage-manager.js';
import { updateActiveColor, getCurrentNoteId } from '../../editor/scripts/note-editor.js';
import { refreshNoteListView } from './note-search.js';

/**
 * Change note color [更改笔记颜色]
 */
export async function changeNoteColor(color: string): Promise<void> {
  const currentNoteId = getCurrentNoteId();
  if (!currentNoteId) return;
  await storageManager.updateNote(currentNoteId, { color });
  updateActiveColor(color);
  await refreshNoteListView();
}
