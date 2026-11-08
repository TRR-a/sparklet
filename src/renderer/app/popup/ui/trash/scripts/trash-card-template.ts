// Trash card: HTML template [回收站卡片 - HTML 模板]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import type { NoteListItem } from '../../../note/list/scripts/note-list.js';

/** Build the card body markup [构建卡片主体标记] */
export function trashCardHtml(note: NoteListItem): string {
  const starIcon = note.starred
    ? `<span class="star-icon" title="${t('tooltip.starred')}">⭐</span>`
    : '';

  return `
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
}
