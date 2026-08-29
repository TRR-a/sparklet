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

/** Collapsed group keys, kept across re-renders [折叠的分组键，重渲染后保持] */
export const collapsedGroups = new Set<string>();

/**
 * Create a collapsible group title [创建可折叠的分组标题]
 * @param key Group identity for collapse state [分组折叠状态键]
 * @param label Group label text [分组标题文本]
 * @returns Group title list element [分组标题 li 元素]
 */
export function createGroupTitle(key: string, label: string): HTMLElement {
  const title = document.createElement('li');
  title.className = 'note-group-title';
  const isCollapsed = collapsedGroups.has(key);
  if (isCollapsed) title.classList.add('collapsed');
  title.innerHTML =
    `<span class="group-caret">${isCollapsed ? '▶' : '▼'}</span>` +
    `<span class="group-label">${label}</span>`;

  title.addEventListener('click', () => {
    const collapsed = title.classList.toggle('collapsed');
    const caret = title.querySelector('.group-caret');
    if (caret) caret.textContent = collapsed ? '▶' : '▼';
    if (collapsed) collapsedGroups.add(key);
    else collapsedGroups.delete(key);

    // Toggle every following sibling until the next group title [切换到下一个分组标题前的所有兄弟元素]
    let next = title.nextElementSibling;
    while (next && !next.classList.contains('note-group-title')) {
      (next as HTMLElement).style.display = collapsed ? 'none' : '';
      next = next.nextElementSibling;
    }
  });

  return title;
}

/**
 * Create an empty-group placeholder [创建空分组占位项]
 * @returns Empty hint list element [-无- 提示 li 元素]
 */
export function createGroupEmpty(): HTMLElement {
  const empty = document.createElement('li');
  empty.className = 'note-group-empty';
  empty.textContent = t('noteList.empty');
  return empty;
}

/**
 * Apply a group key + initial collapse state to a card element [为卡片元素设置分组键与初始折叠状态]
 * @param card Card element [卡片元素]
 * @param key Group key [分组键]
 */
export function applyGroup(card: HTMLElement, key: string): HTMLElement {
  card.dataset.group = key;
  if (collapsedGroups.has(key)) card.style.display = 'none';
  return card;
}

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
  deletedAt?: string | null;
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
  noteList.appendChild(createGroupTitle('pinned', t('noteList.groupPinned')));
  if (pinnedNotes.length > 0) {
    pinnedNotes.forEach(note => noteList.appendChild(applyGroup(createCard(note), 'pinned')));
  } else {
    noteList.appendChild(createGroupEmpty());
  }

  // Starred group [星标分组]
  noteList.appendChild(createGroupTitle('starred', t('noteList.groupStarred')));
  if (starredNotes.length > 0) {
    starredNotes.forEach(note => noteList.appendChild(applyGroup(createCard(note), 'starred')));
  } else {
    noteList.appendChild(createGroupEmpty());
  }

  // Recent group (non-pinned, non-starred) [最近分组 (未置顶未星标)]
  noteList.appendChild(createGroupTitle('recent', t('noteList.groupRecent')));
  if (normalNotes.length > 0) {
    normalNotes.forEach(note => noteList.appendChild(applyGroup(createCard(note), 'recent')));
  } else {
    noteList.appendChild(createGroupEmpty());
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
