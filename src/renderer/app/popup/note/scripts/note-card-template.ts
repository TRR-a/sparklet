// Note card: html template [笔记卡片 - HTML 模板]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { formatDate } from 'sparklet/renderer/shared/ui/dom-utils.js';
import type { NoteListItem } from './note-list.js';

/** Build the card inner HTML [构造卡片内部 HTML] */
export function buildCardHtml(note: NoteListItem): string {
  const pinIcon = note.pinned
    ? `<span class="pin-icon" title="${t('tooltip.pinned')}">📌</span>`
    : '';
  const starIcon = note.starred
    ? `<span class="star-icon" title="${t('tooltip.starred')}">⭐</span>`
    : '';

  return `
    <span class="note-checkbox" aria-hidden="true"></span>
    <span class="note-color-dot" style="background-color: ${note.color};"></span>
    <div class="note-text">
      <div class="note-title">${pinIcon}${starIcon}${note.title || t('main.noteUntitled')}<span class="note-format-tag">(MD)</span></div>
      <div class="note-time">${formatDate(note.updatedAt)}</div>
      ${note.tags && note.tags.length ? `<div class="note-tags">${note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')}</div>` : ''}
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
      <button class="menu-item tag-edit" data-action="tags">${t('noteMenu.editTags')}</button>
      <button class="menu-item select-mode" data-action="select">${t('noteMenu.select')}</button>
      <button class="menu-item note-history" data-action="history">${t('noteMenu.history')}</button>
      <button class="menu-item note-info" data-action="info">${t('noteMenu.info')}</button>
    </div>
  `;
}
