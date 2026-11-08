// Note card - single note list card element with actions [笔记卡片 - 单个笔记列表卡片及其操作]
//
// Split out [已拆分]：template → note-card-template.ts, card click → note-card-events.ts,
// menu/delete bindings → note-card-menu.ts.

import { isSelected } from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-state.js';
import type { NoteListItem } from 'sparklet/renderer/app/popup/note/list/scripts/note-list.js';
import { buildCardHtml } from 'sparklet/renderer/app/popup/note/card/scripts/note-card-template.js';
import { bindCardClick } from 'sparklet/renderer/app/popup/note/card/scripts/note-card-events.js';
import { bindDeleteButton, bindMoreButton, bindCardMenu } from 'sparklet/renderer/app/popup/note/card/scripts/note-card-menu.js';

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
  if (isSelected(note.id)) li.classList.add('selected');

  li.innerHTML = buildCardHtml(note);

  bindCardClick(li, note);
  bindDeleteButton(li, note);
  bindMoreButton(li, note);
  bindCardMenu(li, note);

  return li;
}
