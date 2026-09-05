// Note card - single note list card element with actions [笔记卡片 - 单个笔记列表卡片及其操作]

import { t } from '../../Modules/i18n.js';
import { formatDate } from '../../Base/dom-utils.js';
import {
  handleDeleteNote,
  togglePinNote,
  toggleStarNote
} from './note-operations.js';
import { closeAllMenus, toggleCardMenu } from './note-menu.js';
import { showNoteInfo } from './note-info-modal.js';
import { showNoteHistory } from './note-history-modal.js';
import type { NoteListItem } from './note-list.js';

/**
 * Create a single note card element [创建单个笔记卡片元素]
 * @param note Note list item data [笔记列表项数据]
 * @param activeNoteId Currently active note ID for highlight (null = none) [当前选中笔记 ID 用于高亮 (null=无)]
 * @returns Card list element [卡片 li 元素]
 */
export function createNoteCard(note: NoteListItem, activeNoteId: string | null): HTMLElement {
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
      <button class="menu-item note-history" data-action="history">${t('noteMenu.history')}</button>
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
      toggleCardMenu(li, note.id);
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
      } else if (action === 'history') {
        await showNoteHistory(note.id);
      } else if (action === 'info') {
        await showNoteInfo(note.id);
      }
    });
  }

  return li;
}
