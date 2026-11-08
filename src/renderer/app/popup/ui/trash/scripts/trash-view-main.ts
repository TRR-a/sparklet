// Trash view: main list restore [回收站视图 - 主视图恢复]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { renderNoteList, loadNoteIntoEditor, setCurrentNoteId } from '../../../editor/scripts/note-editor.js';

/**
 * Load main view notes [加载主视图笔记]
 */
export async function loadMainView(): Promise<void> {
  // Refresh from file system to ensure cache is up-to-date [从文件系统刷新确保缓存最新]
  await storageManager.refresh();
  const notes = await storageManager.getNotes();
  await renderNoteList(notes, notes.length > 0 ? notes[0].id : null);
  // Restore first note into editor if available [恢复第一个笔记到编辑器]
  if (notes.length > 0) {
    const firstNote = await storageManager.getNoteById(notes[0].id);
    if (firstNote) {
      setCurrentNoteId(firstNote.id);
      await loadNoteIntoEditor(firstNote);
    }
  }
}
