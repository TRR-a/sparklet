// Trash view - handles trash list rendering, restore, and permanent delete [回收站视图 - 处理回收站列表渲染、恢复、永久删除]

import storageManager from '../../Modules/storage-manager.js';
import { t } from '../../Modules/i18n.js';
import { showCustomConfirm } from '../../Modules/custom-dialog.js';
import { renderNoteList, loadNoteIntoEditor, getCurrentNoteId, setCurrentNoteId, getPreviewMode, setPreviewMode } from './note-editor.js';
import { createGroupTitle, createGroupEmpty, collapsedGroups } from './note-group.js';
import { closeAllMenus } from './note-menu.js';
import { renderVirtualNoteList, type VirtualItem } from './note-virtual-list.js';
import { clearSearch } from './note-search.js';
import { isSelectionMode, isSelected, toggleSelect, enterSelectionMode } from './selection-state.js';
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
  const searchBox = document.querySelector('.note-search-box') as HTMLElement | null;
  if (!trashToggleBtn) return;

  if (currentView === 'main') {
    currentView = 'trash';
    document.body.classList.add('trash-view');
    clearSearch(); // Search is main-view only [搜索仅主视图可用]
    if (searchBox) searchBox.style.display = 'none';
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
    if (editorToolbar) (editorToolbar as HTMLElement).style.display = 'none';
    // Show preview area with initial hint [显示预览区域并展示初始提示]
    if (notePreview) {
      notePreview.innerHTML = `<p class="trash-preview-hint">${t('main.trashPreviewHint')}</p>`;
      notePreview.style.display = 'block';
    }
    await renderTrashList();
  } else {
    currentView = 'main';
    document.body.classList.remove('trash-view');
    // Safety: clear stale blur-background and glow mask [安全清除残留 blur-background 和光晕遮罩]
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
    if (editorToolbar) (editorToolbar as HTMLElement).style.display = 'flex';
    if (searchBox) searchBox.style.display = 'block';
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
 * Supports multi-select: checkbox + more menu with "select" entry; in selection
 * mode clicking the card toggles selection instead of showing preview.
 * [支持多选：复选框 + 含"多选"项的更多菜单；多选模式下点击卡片切换选中而非显示预览]
 */
function createTrashCard(note: NoteListItem): HTMLElement {
  const li = document.createElement('li');
  li.className = 'note-list-item trash-card';
  li.setAttribute('data-note-id', note.id);
  li.style.setProperty('--note-color', note.color);
  if (isSelected(note.id)) li.classList.add('selected');

  const starIcon = note.starred
    ? `<span class="star-icon" title="${t('tooltip.starred')}">⭐</span>`
    : '';

  li.innerHTML = `
      <span class="note-checkbox" aria-hidden="true"></span>
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
      <button class="note-more-btn" title="${t('tooltip.more')}">⋮</button>
      <div class="note-more-menu">
        <button class="menu-item select-mode" data-action="select">${t('noteMenu.select')}</button>
      </div>
    `;

  li.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.trash-actions') || target.closest('.note-more-btn') || target.closest('.note-more-menu')) return;
    // Multi-select mode: toggle selection [多选模式：切换选中]
    if (isSelectionMode()) {
      toggleSelect(note.id);
      return;
    }
    document.querySelectorAll('.trash-view .note-list-item').forEach(item => {
      item.classList.remove('active');
    });
    li.classList.add('active');
    void showTrashPreview(note.id);
  });

  const restoreBtn = li.querySelector('.restore-btn');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', async (e: Event) => {
      e.stopPropagation();
      await restoreFromTrash(note.id);
    });
  }
  const deleteBtn = li.querySelector('.permanent-delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e: Event) => {
      e.stopPropagation();
      await permanentlyDeleteNote(note.id);
    });
  }

  // More menu (select entry only) [更多菜单 (仅多选项)]
  const moreBtn = li.querySelector('.note-more-btn');
  if (moreBtn) {
    moreBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const menu = li.querySelector('.note-more-menu');
      closeAllMenus();
      menu?.classList.toggle('show');
    });
  }
  const menu = li.querySelector('.note-more-menu');
  if (menu) {
    menu.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const btn = (e.target as HTMLElement).closest('[data-action="select"]');
      if (!btn) return;
      closeAllMenus();
      enterSelectionMode();
      toggleSelect(note.id);
    });
  }

  return li;
}

/**
 * Render trash list, grouped into starred / others (both collapsible) [渲染回收站列表，分为星标/其他两组 (均可折叠)]
 */
export async function renderTrashList(): Promise<void> {
  if (!document.getElementById('noteList')) return;
  closeAllMenus();
  const trashedNotes = await storageManager.getTrashNotes();

  // Split starred trashed notes from the rest [拆分星标删除笔记与其余笔记]
  const starredNotes = trashedNotes.filter(note => note.starred);
  const otherNotes = trashedNotes.filter(note => !note.starred);

  const items: VirtualItem[] = [];
  const pushGroup = (key: string, label: string, group: NoteListItem[]) => {
    items.push({ kind: 'title', key, label });
    if (collapsedGroups.has(key)) return;
    if (group.length > 0) {
      group.forEach(note => items.push({ kind: 'card', note, variant: 'trash' }));
    } else {
      items.push({ kind: 'empty' });
    }
  };
  pushGroup('trash-starred', t('noteList.groupStarred'), starredNotes);
  pushGroup('trash-others', t('noteList.groupOthers'), otherNotes);

  renderVirtualNoteList(items, {
    createTitle: item => createGroupTitle(item.key, item.label, () => void renderTrashList()),
    createEmpty: item => createGroupEmpty(item.label),
    createCard: item => createTrashCard(item.note),
  }, { activeNoteId: null });
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

// Esc in trash view returns to main notes (capture phase; modals keep their own Esc) [回收站中按 Esc 返回主笔记 (capture 阶段；弹窗保留自身 Esc 处理)]
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || currentView !== 'trash') return;
  const modalOpen = ['customConfirmModal', 'noteInfoModal', 'noteHistoryModal', 'shortcutModal', 'exitConfirmModal']
    .some(id => {
      const el = document.getElementById(id);
      return el !== null && (el as HTMLElement).style.display !== 'none';
    });
  if (modalOpen) return;
  e.preventDefault();
  e.stopPropagation();
  void toggleTrashView();
}, true);
