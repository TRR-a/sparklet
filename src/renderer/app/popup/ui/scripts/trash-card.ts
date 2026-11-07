// Trash note card [回收站笔记卡片]
//
// Split out [已拆分]：markup → trash-card-template.ts, handlers → trash-card-events.ts.

import { isSelected } from './selection-state.js';
import type { NoteListItem } from '../../note/scripts/note-list.js';
import { trashCardHtml } from './trash-card-template.js';
import { bindTrashCardEvents } from './trash-card-events.js';

/**
 * Create a single trash note card [创建单个回收站笔记卡片]
 * Supports multi-select: checkbox + more menu with "select" entry; in selection
 * mode clicking the card toggles selection instead of showing preview.
 * [支持多选：复选框 + 含"多选"项的更多菜单；多选模式下点击卡片切换选中而非显示预览]
 */
export function createTrashCard(note: NoteListItem): HTMLElement {
  const li = document.createElement('li');
  li.className = 'note-list-item trash-card';
  li.setAttribute('data-note-id', note.id);
  li.style.setProperty('--note-color', note.color);
  if (isSelected(note.id)) li.classList.add('selected');

  li.innerHTML = trashCardHtml(note);

  bindTrashCardEvents(li, note);

  return li;
}
