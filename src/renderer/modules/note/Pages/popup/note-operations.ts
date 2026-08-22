// Note operations - create, save, delete, color change, pin toggle [笔记操作 - 创建、保存、删除、颜色更改、置顶切换]

import storageManager from '../../Modules/storage-manager.js';
import { t } from '../../Modules/i18n.js';
import {
  renderNoteList,
  loadNoteIntoEditor,
  updateActiveColor,
  getCurrentNoteId,
  setCurrentNoteId
} from '../popup/note-editor.js';

/** Save timeout reference [保存防抖定时器] */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Save current note [保存当前笔记]
 */
export async function saveCurrentNote(): Promise<void> {
  const currentNoteId = getCurrentNoteId();
  if (!currentNoteId) return;
  // Skip if in trash view (prevent renderNoteList overwriting trash list) [回收站视图中跳过 (防止 renderNoteList 覆盖回收站列表)]
  if (document.body.classList.contains('trash-view')) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  const titleInput = document.getElementById('noteTitle') as HTMLInputElement | null;
  const contentInput = document.getElementById('noteArea') as HTMLTextAreaElement | null;
  if (!titleInput || !contentInput) return;
  const title = titleInput.value.trim();
  const content = contentInput.value;
  const finalTitle = title || content.substring(0, 20) || t('main.noteUntitled');
  await storageManager.updateNote(currentNoteId, { title: finalTitle, content });
  const notes = await storageManager.getNotes();
  await renderNoteList(notes);
}

/**
 * Debounced save (800ms delay) [防抖保存 (800ms 延迟)]
 */
export function debounceSave(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCurrentNote, 800);
}

/**
 * Create a new note [创建新笔记]
 */
export async function createNewNote(): Promise<void> {
  const newNote = await storageManager.createNote(t('main.noteUntitled'));
  const notes = await storageManager.getNotes();
  await renderNoteList(notes);
  await loadNoteIntoEditor(newNote);
  const titleInput = document.getElementById('noteTitle') as HTMLInputElement | null;
  if (titleInput) {
    titleInput.focus();
    titleInput.select();
  }
}

/**
 * Change note color [更改笔记颜色]
 */
export async function changeNoteColor(color: string): Promise<void> {
  const currentNoteId = getCurrentNoteId();
  if (!currentNoteId) return;
  await storageManager.updateNote(currentNoteId, { color });
  updateActiveColor(color);
  const notes = await storageManager.getNotes();
  await renderNoteList(notes);
}

/**
 * Toggle note pinned state [切换笔记置顶状态]
 */
export async function togglePinNote(noteId: string): Promise<void> {
  const note = await storageManager.getNoteById(noteId);
  if (!note) return;
  const newPinned = !note.pinned;
  await storageManager.updateNote(noteId, { pinned: newPinned });
  const notes = await storageManager.getNotes();
  await renderNoteList(notes);
}

/**
 * Toggle note starred state [切换笔记星标状态]
 */
export async function toggleStarNote(noteId: string): Promise<void> {
  const note = await storageManager.getNoteById(noteId);
  if (!note) return;
  const newStarred = !note.starred;
  await storageManager.updateNote(noteId, { starred: newStarred });
  const notes = await storageManager.getNotes();
  await renderNoteList(notes);
}

/**
 * Handle note deletion (double-click to confirm) [处理笔记删除 (双击确认)]
 */
export async function handleDeleteNote(noteId: string, listItemElement: HTMLElement): Promise<void> {
  if (listItemElement.classList.contains('deleting')) {
    const success = await storageManager.deleteNote(noteId);
    if (!success) return;
    const activeNotes = await storageManager.getNotes();
    await renderNoteList(activeNotes);
    const currentNoteId = getCurrentNoteId();
    if (noteId === currentNoteId) {
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
