// Note action: create a new note [笔记操作 - 新建笔记]

import storageManager from 'sparklet/renderer/shared/storage/storage-manager.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { renderNoteList, loadNoteIntoEditor } from '../../editor/scripts/note-editor.js';
import { clearSearch } from './note-search.js';

/**
 * Create a new note [创建新笔记]
 */
export async function createNewNote(): Promise<void> {
  // A brand-new note rarely matches the active query - drop the search first [新笔记通常不匹配当前关键词 - 先退出搜索]
  clearSearch();
  const newNote = await storageManager.createNote(t('main.noteUntitled'));
  const notes = await storageManager.getNotes();
  await renderNoteList(notes, newNote.id);
  await loadNoteIntoEditor(newNote);
  const titleInput = document.getElementById('noteTitle') as HTMLInputElement | null;
  if (titleInput) {
    titleInput.focus();
    titleInput.select();
  }
}
