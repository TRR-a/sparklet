// Trash view - handles trash list rendering, restore, and permanent delete [回收站视图 - 处理回收站列表渲染、恢复和永久删除]

import storageManager from '../../Modules/storage-manager';
import { t } from '../../Modules/i18n';
import { renderNoteList, loadNoteIntoEditor, getCurrentNoteId, setCurrentNoteId, getPreviewMode, setPreviewMode } from './note-editor';

/** Current view state: 'main' or 'trash' [当前视图状态：'main' 或 'trash'] */
let currentView = 'main';

/**
 * Toggle between main and trash view [在主视图和回收站视图间切换]
 */
export async function toggleTrashView(): Promise<void> {
  const trashToggleBtn = document.getElementById('trashToggle');
  const newNoteBtn = document.getElementById('newNoteBtn');
  const noteTitleInput = document.getElementById('noteTitle');
  const noteEditor = document.getElementById('noteArea');
  if (!trashToggleBtn) return;

  if (currentView === 'main') {
    currentView = 'trash';
    document.body.classList.add('trash-view');
    // Exit preview mode if active [如果处于预览模式则退出]
    if (getPreviewMode()) {
      setPreviewMode(false);
      const pv = document.getElementById('notePreview');
      const btn = document.getElementById('previewToggleBtn');
      if (pv) (pv as HTMLElement).style.display = 'none';
      if (btn) { btn.classList.remove('active'); btn.textContent = '👁️ 预览'; }
    }
    (trashToggleBtn as HTMLElement).style.opacity = '1';
    (trashToggleBtn as HTMLElement).style.color = '#ea4335';
    if (newNoteBtn) (newNoteBtn as HTMLElement).style.display = 'none';
    if (noteTitleInput) (noteTitleInput as HTMLElement).style.display = 'none';
    if (noteEditor) (noteEditor as HTMLElement).style.display = 'none';
    await renderTrashList();
  } else {
    currentView = 'main';
    document.body.classList.remove('trash-view');
    (trashToggleBtn as HTMLElement).style.opacity = '0.7';
    (trashToggleBtn as HTMLElement).style.color = '';
    if (newNoteBtn) (newNoteBtn as HTMLElement).style.display = 'block';
    if (noteTitleInput) (noteTitleInput as HTMLElement).style.display = 'block';
    if (noteEditor) (noteEditor as HTMLElement).style.display = 'block';
    await loadMainView();
  }
}

/**
 * Load main view notes [加载主视图笔记]
 */
async function loadMainView(): Promise<void> {
  await storageManager.init();
  const notes = await storageManager.getNotes();
  await renderNoteList(notes);
  // Restore first note into editor if available [恢复第一个笔记到编辑器]
  if (notes.length > 0) {
    const firstNote = await storageManager.getNoteById(notes[0].id);
    if (firstNote) {
      setCurrentNoteId(firstNote.id);
      await loadNoteIntoEditor(firstNote);
    }
  }
}

/**
 * Render trash list [渲染回收站列表]
 */
export async function renderTrashList(): Promise<void> {
  const trashedNotes = await storageManager.getTrashNotes();
  const noteList = document.getElementById('noteList');
  if (!noteList) return;
  noteList.innerHTML = '';
  trashedNotes.forEach(note => {
    const li = document.createElement('li');
    li.className = 'note-list-item';
    li.innerHTML = `
      <span class="note-color-dot" style="background-color: ${note.color};"></span>
      <div class="note-text">
        <div class="note-title">${note.title || t('main.noteUntitled')}<span class="note-format-tag">(MD)</span></div>
        <div class="note-filename">${note.id}.md</div>
        <div class="note-time">${t('main.noteDeletedAt')} ${new Date(note.deletedAt || '').toLocaleString()}</div>
      </div>
      <div class="trash-actions">
        <button class="restore-btn" data-note-id="${note.id}">${t('main.btnRestore')}</button>
        <button class="permanent-delete-btn" data-note-id="${note.id}">${t('main.btnPermanentDelete')}</button>
      </div>
    `;
    noteList.appendChild(li);
  });
  document.querySelectorAll('.restore-btn').forEach(btn => {
    btn.addEventListener('click', async (e: Event) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      await restoreFromTrash(target.getAttribute('data-note-id') || '');
    });
  });
  document.querySelectorAll('.permanent-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e: Event) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      await permanentlyDeleteNote(target.getAttribute('data-note-id') || '');
    });
  });
}

/**
 * Restore note from trash [从回收站恢复笔记]
 */
async function restoreFromTrash(noteId: string): Promise<void> {
  const success = await storageManager.restoreNote(noteId);
  if (success) await renderTrashList();
}

/**
 * Permanently delete note (with confirmation) [永久删除笔记 (带确认)]
 */
async function permanentlyDeleteNote(noteId: string): Promise<void> {
  if (!confirm(t('main.confirmPermanentDelete'))) return;
  const success = await storageManager.permanentlyDeleteNote(noteId);
  if (success) await renderTrashList();
}

/** Get current view [获取当前视图] */
export function getCurrentView(): string {
  return currentView;
}
