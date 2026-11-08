// Note action: delete (double-click confirm) [笔记操作 - 删除 (双击确认)]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { loadNoteIntoEditor, getCurrentNoteId, setCurrentNoteId } from 'sparklet/renderer/app/popup/editor/scripts/note-editor.js';
import { refreshNoteListView, clearSearch, isSearchActive } from 'sparklet/renderer/app/popup/note/list/scripts/note-search.js';
import { clearSaveTimers } from 'sparklet/renderer/app/popup/note/scripts/note-save.js';

/**
 * Handle note deletion (double-click to confirm) [处理笔记删除 (双击确认)]
 */
export async function handleDeleteNote(noteId: string, listItemElement: HTMLElement): Promise<void> {
  if (listItemElement.classList.contains('deleting')) {
    // If deleting the currently-open note, drop its pending save timers FIRST:
    // a late debounced save racing the delete IPC can resurrect the note
    // (fs write interleaving in the main process reverts isDeleted to false)
    // [删除当前打开的笔记时先清其待保存定时器：迟到的防抖保存与删除 IPC 竞态，
    //  主进程文件写入交错会把 isDeleted 改回 false 导致笔记复活]
    if (noteId === getCurrentNoteId()) clearSaveTimers();
    const success = await storageManager.deleteNote(noteId);
    if (!success) return;
    // Deleting from search results: drop search and return to the main list [从搜索结果删除：退出搜索回到主列表]
    if (isSearchActive()) clearSearch();
    await refreshNoteListView();
    const currentNoteId = getCurrentNoteId();
    if (noteId === currentNoteId) {
      const activeNotes = await storageManager.getNotes();
      if (activeNotes.length > 0) {
        const firstNote = activeNotes[0];
        setCurrentNoteId(firstNote.id);
        await loadNoteIntoEditor(firstNote);
      } else {
        const newNote = await storageManager.createNote(t('main.noteUntitled'));
        setCurrentNoteId(newNote.id);
        await loadNoteIntoEditor(newNote);
      }
    }
  } else {
    listItemElement.classList.add('deleting');
    setTimeout(() => {
      if (listItemElement.classList.contains('deleting')) {
        listItemElement.classList.remove('deleting');
      }
    }, 3000);
  }
}
