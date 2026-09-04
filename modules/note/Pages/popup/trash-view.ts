// Trash view - handles trash list rendering, restore, and permanent delete [回收站视图 - 处理回收站列表渲染、恢复和永久删除]

import storageManager from '../../Modules/storage-manager.js';
import { t } from '../../Modules/i18n.js';
import { showCustomConfirm } from '../../Modules/custom-dialog.js';
import { renderNoteList, loadNoteIntoEditor, getCurrentNoteId, setCurrentNoteId, getPreviewMode, setPreviewMode } from './note-editor.js';
import { createGroupTitle, createGroupEmpty, applyGroup } from './note-group.js';
import type { NoteListItem } from './note-list.js';
import { renderMarkdown } from '../../Modules/markdown.js';
import { escapeHtml } from '../../Base/dom-utils.js';

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
  const colorPalette = document.querySelector('.color-palette') as HTMLElement | null;
  const editorToolbar = document.querySelector('.editor-toolbar') as HTMLElement | null;
  const notePreview = document.getElementById('notePreview');
  if (!trashToggleBtn) return;

  if (currentView === 'main') {
    currentView = 'trash';
    document.body.classList.add('trash-view');
    // Exit preview mode if active [如果处于预览模式则退出]
    if (getPreviewMode()) {
      setPreviewMode(false);
      const btn = document.getElementById('previewToggleBtn');
      if (btn) { btn.classList.remove('active'); btn.textContent = '👁️ 预览'; }
    }
    (trashToggleBtn as HTMLElement).style.opacity = '1';
    (trashToggleBtn as HTMLElement).style.color = '#ea4335';
    (trashToggleBtn as HTMLElement).textContent = '←';
    (trashToggleBtn as HTMLElement).title = t('tooltip.backToNotes');
    if (newNoteBtn) (newNoteBtn as HTMLElement).style.display = 'none';
    if (noteTitleInput) (noteTitleInput as HTMLElement).style.display = 'none';
    if (noteEditor) (noteEditor as HTMLElement).style.display = 'none';
    if (colorPalette) colorPalette.style.display = 'none';
    if (editorToolbar) editorToolbar.style.display = 'none';
    // Show preview area with initial hint [显示预览区域并展示初始提示]
    if (notePreview) {
      notePreview.innerHTML = `<p class="trash-preview-hint">${t('main.trashPreviewHint')}</p>`;
      notePreview.style.display = 'block';
    }
    await renderTrashList();
  } else {
    currentView = 'main';
    document.body.classList.remove('trash-view');
    // Safety: clear stale blur-background and glow mask [安全清除残留的 blur-background 和光晕遮罩]
    document.body.classList.remove('blur-background');
    const glowMask = document.getElementById('settingsGlowMask');
    if (glowMask) glowMask.classList.remove('show');
    (trashToggleBtn as HTMLElement).style.opacity = '0.7';
    (trashToggleBtn as HTMLElement).style.color = '';
    (trashToggleBtn as HTMLElement).textContent = '🗑️';
    (trashToggleBtn as HTMLElement).title = t('tooltip.trash');
    if (newNoteBtn) (newNoteBtn as HTMLElement).style.display = 'block';
    if (noteTitleInput) (noteTitleInput as HTMLElement).style.display = 'block';
    if (noteEditor) (noteEditor as HTMLElement).style.display = 'block';
    if (colorPalette) colorPalette.style.display = 'flex';
    if (editorToolbar) editorToolbar.style.display = 'flex';
    if (notePreview) {
      notePreview.style.display = 'none';
      notePreview.innerHTML = '';
    }
    await loadMainView();
  }
}

/**
 * Load main view notes [加载主视图笔记]
 */
async function loadMainView(): Promise<void> {
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

/**
 * Create a single trash note card [创建单个回收站笔记卡片]
 * @param note Trashed note metadata [回收站笔记元数据]
 * @returns Card list element [卡片 li 元素]
 */
function createTrashCard(note: NoteListItem): HTMLElement {
  const li = document.createElement('li');
  li.className = 'note-list-item';
  li.setAttribute('data-note-id', note.id);
  li.style.setProperty('--note-color', note.color);

  const starIcon = note.starred
    ? `<span class="star-icon" title="${t('tooltip.starred')}">⭐</span>`
    : '';

  li.innerHTML = `
      <span class="note-color-dot" style="background-color: ${note.color};"></span>
      <div class="note-text">
        <div class="note-title">${starIcon}${note.title || t('main.noteUntitled')}<span class="note-format-tag">(MD)</span></div>
        <div class="note-filename">${note.id}.md</div>
        <div class="note-time">${t('main.noteDeletedAt')} ${new Date(note.deletedAt || '').toLocaleString()}</div>
      </div>
      <div class="trash-actions">
        <button class="restore-btn" data-note-id="${note.id}">${t('main.btnRestore')}</button>
        <button class="permanent-delete-btn" data-note-id="${note.id}">${t('main.btnPermanentDelete')}</button>
      </div>
    `;
  li.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.trash-actions')) {
      document.querySelectorAll('.trash-view .note-list-item').forEach(item => {
        item.classList.remove('active');
      });
      li.classList.add('active');
      void showTrashPreview(note.id);
    }
  });
  return li;
}

/**
 * Render trash list, grouped into starred / others (both collapsible) [渲染回收站列表，分为星标/其他两组 (均可折叠)]
 */
export async function renderTrashList(): Promise<void> {
  const trashedNotes = await storageManager.getTrashNotes();
  const noteList = document.getElementById('noteList');
  if (!noteList) return;
  noteList.innerHTML = '';

  // Split starred trashed notes from the rest [拆分星标删除笔记与其余笔记]
  const starredNotes = trashedNotes.filter(note => note.starred);
  const otherNotes = trashedNotes.filter(note => !note.starred);

  // Starred group [星标分组]
  noteList.appendChild(createGroupTitle('trash-starred', t('noteList.groupStarred')));
  if (starredNotes.length > 0) {
    starredNotes.forEach(note => noteList.appendChild(applyGroup(createTrashCard(note), 'trash-starred')));
  } else {
    noteList.appendChild(createGroupEmpty());
  }

  // Others group [其他分组]
  noteList.appendChild(createGroupTitle('trash-others', t('noteList.groupOthers')));
  if (otherNotes.length > 0) {
    otherNotes.forEach(note => noteList.appendChild(applyGroup(createTrashCard(note), 'trash-others')));
  } else {
    noteList.appendChild(createGroupEmpty());
  }

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
 * Show trash note preview in editor area [在编辑区显示回收站笔记预览]
 */
async function showTrashPreview(noteId: string): Promise<void> {
  const note = await storageManager.getNoteById(noteId);
  if (!note) return;
  const notePreview = document.getElementById('notePreview');
  if (notePreview) {
    const titleHtml = escapeHtml(note.title || t('main.noteUntitled'));
    const contentHtml = renderMarkdown(note.content || '');
    notePreview.innerHTML = `<h2 class="trash-preview-title">${titleHtml}</h2><div class="trash-preview-content">${contentHtml}</div>`;
  }
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
  const confirmed = await showCustomConfirm({
    title: t('confirm.default.title'),
    message: t('main.confirmPermanentDelete'),
    okText: t('main.btnPermanentDelete'),
    cancelText: t('confirm.default.cancel'),
    okDanger: true
  });
  if (!confirmed) return;
  const success = await storageManager.permanentlyDeleteNote(noteId);
  if (success) await renderTrashList();
}

/** Get current view [获取当前视图] */
export function getCurrentView(): string {
  return currentView;
}
