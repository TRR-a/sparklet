// Search results: render the result list [搜索结果 - 渲染结果列表]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { createNoteCard } from '../../card/scripts/note-card.js';
import { renderVirtualNoteList, getActiveNoteId, type VirtualItem } from '../../scripts/note-virtual-list.js';
import type { NoteListItem } from './note-list-types.js';

/** Render search results into the virtual note list [把搜索结果渲染进虚拟笔记列表] */
export function renderSearchResults(notes: NoteListItem[]): void {
  const items: VirtualItem[] = [];
  items.push({ kind: 'title', key: 'search-results', label: t('search.resultTitle', { n: String(notes.length) }) });
  if (notes.length === 0) {
    items.push({ kind: 'empty', label: t('search.noResult') });
  } else {
    notes.forEach(note => items.push({ kind: 'card', note, variant: 'main' }));
  }

  renderVirtualNoteList(items, {
    // Search header is informational only (not collapsible) [搜索结果头仅展示信息 (不可折叠)]
    createTitle: item => {
      const li = document.createElement('li');
      li.className = 'note-group-title';
      li.innerHTML = `<span class="group-label">${item.label}</span>`;
      return li;
    },
    createEmpty: item => {
      const li = document.createElement('li');
      li.className = 'note-group-empty';
      li.textContent = item.label || t('noteList.empty');
      return li;
    },
    createCard: (item, activeNoteId) => createNoteCard(item.note, activeNoteId),
  }, { activeNoteId: getActiveNoteId() });
}
