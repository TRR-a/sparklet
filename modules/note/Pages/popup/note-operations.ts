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
import { refreshNoteListView, clearSearch, isSearchActive } from './note-search.js';

/** Save debounce delay [保存防抖延迟] */
const SAVE_DEBOUNCE_MS = 800;

/**
 * Max wait before a continuous typing session is force-saved
 * [连续输入时的最大等待，超时强制落盘 (防抖定时器随按键不断重置，否则持续打字永不保存)]
 */
const SAVE_MAX_WAIT_MS = 5000;

/** Trailing debounce timer [尾随防抖定时器] */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/** Max-wait force-save timer [最大等待强制保存定时器] */
let maxWaitTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Clear pending save timers [清理待触发的保存定时器]
 */
function clearSaveTimers(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  if (maxWaitTimeout) {
    clearTimeout(maxWaitTimeout);
    maxWaitTimeout = null;
  }
}

/**
 * Save current note [保存当前笔记]
 */
export async function saveCurrentNote(): Promise<void> {
  clearSaveTimers();
  const currentNoteId = getCurrentNoteId();
  if (!currentNoteId) return;
  // Skip if in trash view (prevent renderNoteList overwriting trash list) [回收站视图中跳过 (防止 renderNoteList 覆盖回收站列表)]
  if (document.body.classList.contains('trash-view')) return;
  const titleInput = document.getElementById('noteTitle') as HTMLInputElement | null;
  const contentInput = document.getElementById('noteArea') as HTMLTextAreaElement | null;
  if (!titleInput || !contentInput) return;
  const title = titleInput.value.trim();
  const content = contentInput.value;
  const finalTitle = title || content.substring(0, 20) || t('main.noteUntitled');
  await storageManager.updateNote(currentNoteId, { title: finalTitle, content });
  // Keep the open note highlighted after the list re-renders [重渲染后保持当前打开笔记高亮]
  // Also refreshes search results when a search is active [搜索激活时同样刷新搜索结果]
  await refreshNoteListView();
}

/**
 * Debounced save: 800ms trailing + 5s max wait
 * [防抖保存：800ms 尾随触发 + 连续输入最多 5s 强制落盘]
 */
export function debounceSave(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    void saveCurrentNote();
  }, SAVE_DEBOUNCE_MS);

  if (!maxWaitTimeout) {
    maxWaitTimeout = setTimeout(() => {
      maxWaitTimeout = null;
      void saveCurrentNote();
    }, SAVE_MAX_WAIT_MS);
  }
}

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

/**
 * Handle note deletion (double-click to confirm) [处理笔记删除 (双击确认)]
 */
export async function handleDeleteNote(noteId: string, listItemElement: HTMLElement): Promise<void> {
  if (listItemElement.classList.contains('deleting')) {
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
