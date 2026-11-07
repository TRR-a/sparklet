// Trash card: more-menu handler [回收站卡片 - 更多菜单处理]

import { closeAllMenus } from '../../note/scripts/note-menu.js';
import { toggleSelect, enterSelectionMode } from './selection-state.js';
import type { NoteListItem } from '../../note/scripts/note-list.js';

/** Wire the "more" button and its menu [接线更多按钮及其菜单] */
export function bindTrashCardMenu(li: HTMLElement, note: NoteListItem): void {
  // More menu (select entry only) [更多菜单 (仅多选项)]
  const moreBtn = li.querySelector('.note-more-btn');
  if (moreBtn) {
    moreBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const menu = li.querySelector('.note-more-menu');
      closeAllMenus();
      menu?.classList.toggle('show');
    });
  }
  const menu = li.querySelector('.note-more-menu');
  if (menu) {
    menu.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const btn = (e.target as HTMLElement).closest('[data-action="select"]');
      if (!btn) return;
      closeAllMenus();
      enterSelectionMode();
      toggleSelect(note.id);
    });
  }
}
