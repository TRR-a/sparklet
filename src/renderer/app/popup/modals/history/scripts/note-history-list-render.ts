// Note history modal: snapshot list rendering [笔记历史弹窗 - 快照列表渲染]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { formatDateTime, escapeHtml } from 'sparklet/renderer/shared/ui/dom/dom-utils.js';
import type { NoteHistoryEntry } from 'sparklet/shared/types/note/notes.js';

/** Get the modal element [获取弹窗元素] */
export function getHistoryModal(): HTMLElement | null {
  return document.getElementById('noteHistoryModal');
}

/**
 * Render the snapshot list [渲染快照列表]
 */
export function renderHistoryList(
  entries: NoteHistoryEntry[],
  selectedTs: string | null,
  onSelect: (ts: string) => void
): void {
  const listEl = document.getElementById('noteHistoryList');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = t('history.empty');
    listEl.appendChild(empty);
    return;
  }

  for (const entry of entries) {
    const item = document.createElement('div');
    item.className = 'history-item' + (entry.ts === selectedTs ? ' selected' : '');
    item.innerHTML = `
      <div class="history-item-time">${formatDateTime(entry.savedAt)}</div>
      <div class="history-item-title">${escapeHtml(entry.title || t('main.noteUntitled'))}</div>
      <div class="history-item-chars">${t('history.charCount', { n: String(entry.charCount) })}</div>
    `;
    item.addEventListener('click', () => onSelect(entry.ts));
    listEl.appendChild(item);
  }
}
