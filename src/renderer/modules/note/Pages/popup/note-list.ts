// Note list rendering - list rendering, card menu, note info modal, global menu handler [笔记列表渲染 - 列表渲染、卡片菜单、笔记信息弹窗、全局菜单处理器]

import storageManager from '../../Modules/storage-manager.js';
import { t } from '../../Modules/i18n.js';
import { formatDate } from '../../Base/dom-utils.js';
import {
  handleDeleteNote,
  togglePinNote,
  toggleStarNote
} from './note-operations.js';

/** Currently open more-menu note ID (null = no menu open) [当前打开更多菜单的笔记 ID (null=无菜单打开)] */
let openMenuNoteId: string | null = null;

/**
 * Close all open note more-menus [关闭所有打开的笔记更多菜单]
 */
export function closeAllMenus(): void {
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

/** Note list item data [笔记列表项数据] */
export interface NoteListItem {
  id: string;
  color: string;
  title: string;
  updatedAt: string;
  pinned?: boolean;
  starred?: boolean;
}

/**
 * Render the note list [渲染笔记列表]
 * @param notes Note list data [笔记数据]
 * @param activeNoteId Currently active note ID for highlight (null = none) [当前选中笔记 ID 用于高亮 (null=无)]
 */
export async function renderNoteList(notes: NoteListItem[], activeNoteId: string | null = null): Promise<void> {
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
    if (note.id === activeNoteId) li.classList.add('active');
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

    // Click card body → switch note (dynamic import to avoid circular dep) [点击卡片主体→切换笔记 (动态导入避免循环依赖)]
    li.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.note-more-btn') || target.closest('.note-more-menu') || target.closest('.note-delete-btn')) return;
      void import('./note-editor.js').then(({ switchNote }) => switchNote(note.id));
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
