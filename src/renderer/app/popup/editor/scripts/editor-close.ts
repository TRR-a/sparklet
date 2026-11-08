// Editor: close current note [编辑器 - 关闭当前笔记]

import { closeFilePreview } from 'sparklet/renderer/app/project/scripts/project-view.js';
import { saveCurrentNote } from 'sparklet/renderer/app/popup/note/scripts/note-operations.js';
import { syncActiveNoteInList } from 'sparklet/renderer/app/popup/note/scripts/note-virtual-list.js';
import { getCurrentNoteId, setCurrentNoteId } from 'sparklet/renderer/app/popup/editor/scripts/editor-state.js';

/**
 * Close the currently open note (save first, clear editor, deselect card) [关闭当前打开的笔记 (先保存，清空编辑器，取消卡片选中)]
 */
export async function closeNote(): Promise<void> {
  if (!getCurrentNoteId()) return;
  closeFilePreview();
  await saveCurrentNote();
  setCurrentNoteId(null);
  const titleInput = document.getElementById('noteTitle') as HTMLInputElement | null;
  const contentInput = document.getElementById('noteArea') as HTMLTextAreaElement | null;
  if (titleInput) titleInput.value = '';
  if (contentInput) contentInput.value = '';
  syncActiveNoteInList(null);
}
