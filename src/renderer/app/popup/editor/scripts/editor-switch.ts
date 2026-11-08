// Editor: switch note [编辑器 - 切换笔记]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { closeFilePreview } from 'sparklet/renderer/app/project/scripts/project-view.js';
import { saveCurrentNote } from 'sparklet/renderer/app/popup/note/scripts/note-operations.js';
import { loadNoteIntoEditor } from 'sparklet/renderer/app/popup/editor/scripts/editor-load.js';

/**
 * Switch to a different note [切换笔记]
 */
export async function switchNote(noteId: string): Promise<void> {
  closeFilePreview();
  await saveCurrentNote();
  const note = await storageManager.getNoteById(noteId);
  if (note) await loadNoteIntoEditor(note);
}
