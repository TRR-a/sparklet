// Popup note editor - handles note loading, editing state, list rendering, and card menu [弹窗笔记编辑器 - 处理笔记加载、编辑状态、列表渲染和卡片菜单]
// Note operations (save/create/delete/color/pin) moved to note-operations.ts [笔记操作 (保存/创建/删除/颜色/置顶) 已移至 note-operations.ts]

import storageManager from '../../Modules/storage-manager.js';
import { t } from '../../Modules/i18n.js';
import { formatDate } from '../../Base/dom-utils.js';
import { renderMarkdown } from '../../Modules/markdown.js';
import {
  saveCurrentNote,
  createNewNote,
  handleDeleteNote,
  togglePinNote,
  toggleStarNote
} from './note-operations.js';
import { closeFilePreview } from '../../../project/project-view.js';

// Re-export note operations for backward compatibility [重新导出笔记操作以保持向后兼容]
export { saveCurrentNote, debounceSave, createNewNote, changeNoteColor, togglePinNote, toggleStarNote } from './note-operations.js';

/** Preview mode state [预览模式状态] */
let isPreviewMode = false;

/** Current active note ID [当前选中的笔记 ID] */
let currentNoteId: string | null = null;

/** Currently open more-menu note ID (null = no menu open) [当前打开更多菜单的笔记 ID (null=无菜单打开)] */
let openMenuNoteId: string | null = null;

/**
 * Update active color indicator [更新颜色选中状态]
 */
export function updateActiveColor(color: string): void {
  document.querySelectorAll('.color-option').forEach((btn: Element) => {
    btn.classList.toggle('active', btn.getAttribute('data-color') === color);
  });
}

/**
 * Close all open note more-menus [关闭所有打开的笔记更多菜单]
 */
function closeAllMenus(): void {
  document.querySelectorAll('.note-more-menu.show').forEach(menu => {
    menu.classList.remove('show');
  });
  openMenuNoteId = null;
}

/**
 * Show note detail info modal [显示笔记详细信息弹窗]
 */
export async function showNoteInfo(noteId: string): Promise<void> {
  const note = await storageManager.getNoteById(noteId);
  if (!note) return;

  const modal = document.getElementById('noteInfoModal');
  const bodyEl = document.getElementById('noteInfoBody');
  if (!modal || !bodyEl) return;

  const wordCount = note.content ? note.content.length : 0;
  const lineCount = note.content ? note.content.split('\n').length : 0;

  bodyEl.innerHTML = `
    <div class="info-row"><span class="info-label">${t('noteInfo.label.title')}</span><span class="info-value">${note.title || t('main.noteUntitled')}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.filename')}</span><span class="info-value info-mono">${note.id}.md</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.createdAt')}</span><span class="info-value">${formatDate(note.createdAt)}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.updatedAt')}</span><span class="info-value">${formatDate(note.updatedAt)}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.charCount')}</span><span class="info-value">${wordCount}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.lineCount')}</span><span class="info-value">${lineCount}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.pinned')}</span><span class="info-value">${note.pinned ? '📌 ' + t('noteInfo.value.yes') : t('noteInfo.value.no')}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.starred')}</span><span class="info-value">${note.starred ? '⭐ ' + t('noteInfo.value.yes') : t('noteInfo.value.no')}</span></div>
  `;

  (modal as HTMLElement).style.display = 'flex';
}

/**
 * Load note into editor [加载笔记到编辑器]
 */
export async function loadNoteIntoEditor(note: { id: string } | null): Promise<void> {
  if (!note) return;
  closeAllMenus();
  // Exit preview mode if active [如果处于预览模式则退出]
  if (isPreviewMode) {
    isPreviewMode = false;
    const btn = document.getElementById('previewToggleBtn');
    if (btn) { btn.classList.remove('active'); btn.textContent = '👁️ 预览'; }
  }
  // Safety: ensure editor textarea is visible and preview is hidden [安全检查：确保编辑器文本区可见且预览隐藏]
  const ta = document.getElementById('noteArea');
  const pv = document.getElementById('notePreview');
  if (ta) (ta as HTMLElement).style.display = 'block';
  if (pv) (pv as HTMLElement).style.display = 'none';
  // Safety: clear stale blur-background if settings glow mask is not shown [安全清除残留的 blur-background (如果设置光晕未显示)]
  const glowMaskEl = document.getElementById('settingsGlowMask');
  if (document.body.classList.contains('blur-background') && glowMaskEl && !glowMaskEl.classList.contains('show')) {
    document.body.classList.remove('blur-background');
  }
  currentNoteId = note.id;
  const fullNote = await storageManager.getNoteById(note.id);
  if (!fullNote) return;
  const titleInput = document.getElementById('noteTitle') as HTMLInputElement | null;
  const contentInput = document.getElementById('noteArea') as HTMLTextAreaElement | null;
  if (titleInput) titleInput.value = fullNote.title || '';
  if (contentInput) contentInput.value = fullNote.content || '';
  updateActiveColor(fullNote.color);
  document.querySelectorAll('.note-list-item').forEach((item: Element) => {
    item.classList.toggle('active', item.getAttribute('data-note-id') === note.id);
  });
}

/** Note list item data [笔记列表项数据] */
interface NoteListItem {
  id: string;
  color: string;
  title: string;
  updatedAt: string;
  pinned?: boolean;
  starred?: boolean;
}

/**
 * Render the note list [渲染笔记列表]
 */
export async function renderNoteList(notes: NoteListItem[]): Promise<void> {
  const noteList = document.getElementById('noteList');
  if (!noteList) return;
  noteList.innerHTML = '';
  closeAllMenus();

  // Split into pinned, starred, and normal groups [分为置顶、星标、普通三组]
  const pinnedNotes = notes.filter(n => n.pinned);
  const starredNotes = notes.filter(n => !n.pinned && n.starred);
  const normalNotes = notes.filter(n => !n.pinned && !n.starred);

  /** Create a single note card element [创建单个笔记卡片元素] */
  const createCard = (note: NoteListItem): HTMLElement => {
    const li = document.createElement('li');
    li.className = 'note-list-item';
    li.setAttribute('data-note-id', note.id);
    li.style.setProperty('--note-color', note.color);
    if (note.id === currentNoteId) li.classList.add('active');
    if (note.pinned) li.classList.add('pinned');

    const pinIcon = note.pinned
      ? `<span class="pin-icon" title="${t('tooltip.pinned')}">📌</span>`
      : '';
    const starIcon = note.starred
      ? `<span class="star-icon" title="${t('tooltip.starred')}">⭐</span>`
      : '';

    li.innerHTML = `
      <span class="note-color-dot" style="background-color: ${note.color};"></span>
      <div class="note-text">
        <div class="note-title">${pinIcon}${starIcon}${note.title || t('main.noteUntitled')}<span class="note-format-tag">(MD)</span></div>
        <div class="note-time">${formatDate(note.updatedAt)}</div>
      </div>
      <button class="note-delete-btn" data-i18n-title="tooltip.deleteNote" title="${t('tooltip.deleteNote')}">🗑️</button>
      <button class="note-more-btn" data-i18n-title="tooltip.more" title="${t('tooltip.more')}">⋮</button>
      <div class="note-more-menu">
        <button class="menu-item pin-toggle" data-action="pin">
          ${note.pinned ? t('noteMenu.unpin') : t('noteMenu.pin')}
        </button>
        <button class="menu-item star-toggle" data-action="star">
          ${note.starred ? t('noteMenu.unstar') : t('noteMenu.star')}
        </button>
        <button class="menu-item note-info" data-action="info">${t('noteMenu.info')}</button>
      </div>
    `;

    // Click card body → switch note [点击卡片主体→切换笔记]
    li.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.note-more-btn') || target.closest('.note-more-menu') || target.closest('.note-delete-btn')) return;
      switchNote(note.id);
    });

    // Delete button → double-click confirm [删除按钮→双击确认]
    const deleteBtn = li.querySelector('.note-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e: Event) => {
        e.stopPropagation();
        await handleDeleteNote(note.id, li);
      });
    }

    // More button → toggle menu [更多按钮→切换菜单]
    const moreBtn = li.querySelector('.note-more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        const menu = li.querySelector('.note-more-menu');
        if (!menu) return;
        const isOpen = menu.classList.contains('show');
        closeAllMenus();
        if (!isOpen) {
          menu.classList.add('show');
          openMenuNoteId = note.id;
        }
      });
    }

    // Menu items [菜单项]
    const menu = li.querySelector('.note-more-menu');
    if (menu) {
      menu.addEventListener('click', async (e: Event) => {
        e.stopPropagation();
        const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        closeAllMenus();
        if (action === 'pin') {
          await togglePinNote(note.id);
        } else if (action === 'star') {
          await toggleStarNote(note.id);
        } else if (action === 'info') {
          await showNoteInfo(note.id);
        }
      });
    }

    return li;
  };

  // Pinned group [置顶分组]
  const pinnedTitle = document.createElement('li');
  pinnedTitle.className = 'note-group-title';
  pinnedTitle.textContent = t('noteList.groupPinned');
  noteList.appendChild(pinnedTitle);
  if (pinnedNotes.length > 0) {
    pinnedNotes.forEach(note => noteList.appendChild(createCard(note)));
  } else {
    const empty = document.createElement('li');
    empty.className = 'note-group-empty';
    empty.textContent = t('noteList.empty');
    noteList.appendChild(empty);
  }

  // Starred group [星标分组]
  const starredTitle = document.createElement('li');
  starredTitle.className = 'note-group-title';
  starredTitle.textContent = t('noteList.groupStarred');
  noteList.appendChild(starredTitle);
  if (starredNotes.length > 0) {
    starredNotes.forEach(note => noteList.appendChild(createCard(note)));
  } else {
    const empty = document.createElement('li');
    empty.className = 'note-group-empty';
    empty.textContent = t('noteList.empty');
    noteList.appendChild(empty);
  }

  // Recent group (non-pinned, non-starred) [最近分组 (未置顶未星标)]
  const recentTitle = document.createElement('li');
  recentTitle.className = 'note-group-title';
  recentTitle.textContent = t('noteList.groupRecent');
  noteList.appendChild(recentTitle);
  if (normalNotes.length > 0) {
    normalNotes.forEach(note => noteList.appendChild(createCard(note)));
  } else {
    const empty = document.createElement('li');
    empty.className = 'note-group-empty';
    empty.textContent = t('noteList.empty');
    noteList.appendChild(empty);
  }
}

/**
 * Switch to a different note [切换笔记]
 */
export async function switchNote(noteId: string): Promise<void> {
  closeFilePreview();
  await saveCurrentNote();
  const note = await storageManager.getNoteById(noteId);
  if (note) await loadNoteIntoEditor(note);
}

/**
 * Toggle markdown preview mode [切换 Markdown 预览模式]
 */
export async function togglePreview(): Promise<void> {
  const textarea = document.getElementById('noteArea');
  const preview = document.getElementById('notePreview');
  const btn = document.getElementById('previewToggleBtn');
  if (!textarea || !preview || !btn) return;

  isPreviewMode = !isPreviewMode;

  if (isPreviewMode) {
    await saveCurrentNote();
    preview.innerHTML = renderMarkdown((textarea as HTMLTextAreaElement).value);
    (textarea as HTMLElement).style.display = 'none';
    (preview as HTMLElement).style.display = 'block';
    btn.classList.add('active');
    btn.textContent = '✏️ 编辑';
  } else {
    (textarea as HTMLElement).style.display = 'block';
    (preview as HTMLElement).style.display = 'none';
    btn.classList.remove('active');
    btn.textContent = '👁️ 预览';
  }
}

/** Set current note ID (for trash module access) [设置当前笔记 ID (供回收站模块访问)] */
export function setCurrentNoteId(id: string | null): void {
  currentNoteId = id;
}

/** Get current note ID [获取当前笔记 ID] */
export function getCurrentNoteId(): string | null {
  return currentNoteId;
}

/** Set preview mode state [设置预览模式状态] */
export function setPreviewMode(value: boolean): void {
  isPreviewMode = value;
}

/** Get preview mode state [获取预览模式状态] */
export function getPreviewMode(): boolean {
  return isPreviewMode;
}

/**
 * Bind global click-to-close menu handler (call once on init) [绑定全局点击关闭菜单处理器 (初始化时调用一次)]
 */
export function bindNoteMenuGlobalHandler(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.note-more-btn') && !(e.target as HTMLElement).closest('.note-more-menu')) {
      closeAllMenus();
    }
  });

  // Close note info modal on overlay click [点击遮罩关闭详细信息弹窗]
  const modal = document.getElementById('noteInfoModal');
  if (modal) {
    modal.addEventListener('click', (e: MouseEvent) => {
      if (e.target === modal) {
        (modal as HTMLElement).style.display = 'none';
      }
    });
  }
  const closeBtn = document.getElementById('noteInfoCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const m = document.getElementById('noteInfoModal');
      if (m) (m as HTMLElement).style.display = 'none';
    });
  }
}

/**
 * Load notes on startup [启动时加载笔记]
 */
export async function loadNotes(): Promise<void> {
  await storageManager.init();
  bindNoteMenuGlobalHandler();
  // Bind preview toggle button once (avoid listener accumulation) [绑定预览切换按钮 (避免监听器累积)]
  const previewToggleBtn = document.getElementById('previewToggleBtn');
  if (previewToggleBtn) previewToggleBtn.addEventListener('click', togglePreview);
  const notes = await storageManager.getNotes();
  if (notes.length === 0) {
    const newNote = await storageManager.createNote(t('main.noteUntitled'));
    currentNoteId = newNote.id;
    await renderNoteList([newNote]);
    await loadNoteIntoEditor(newNote);
  } else {
    await renderNoteList(notes);
    // Get first note's complete content (including content) [获取第一个笔记的完整内容 (包含 content)]
    const firstNote = await storageManager.getNoteById(notes[0].id);
    if (firstNote) {
      currentNoteId = firstNote.id;
      await loadNoteIntoEditor(firstNote);
    } else {
      // Fallback [容错]
      currentNoteId = notes[0].id;
      await loadNoteIntoEditor(notes[0]);
    }
  }
}
