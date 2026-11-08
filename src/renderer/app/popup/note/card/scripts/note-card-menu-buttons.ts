// Note card: more / delete button bindings [笔记卡片 - 更多与删除按钮事件]

import { handleDeleteNote } from '../../scripts/note-operations.js';
import { toggleCardMenu } from '../../scripts/note-menu.js';
import type { NoteListItem } from '../../list/scripts/note-list.js';

/** Bind the more button (opens card menu) [绑定更多按钮 (打开卡片菜单)] */
export function bindMoreButton(li: HTMLElement, note: NoteListItem): void {
  const moreBtn = li.querySelector('.note-more-btn');
  if (moreBtn) {
    moreBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      toggleCardMenu(li, note.id);
    });
  }
}

/** Bind delete button (double-click confirm) [绑定删除按钮 (双击确认)] */
export function bindDeleteButton(li: HTMLElement, note: NoteListItem): void {
  const deleteBtn = li.querySelector('.note-delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e: Event) => {
      e.stopPropagation();
      await handleDeleteNote(note.id, li);
    });
  }
}
