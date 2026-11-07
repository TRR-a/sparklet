// Note card: menu item actions [笔记卡片 - 菜单项动作]

import { togglePinNote, toggleStarNote, editTagsNote } from './note-operations.js';
import { closeAllMenus } from './note-menu.js';
import { showNoteInfo } from '../../modals/scripts/note-info-modal.js';
import { showNoteHistory } from '../../modals/scripts/note-history-modal.js';
import { toggleSelect, enterSelectionMode } from '../../ui/scripts/selection-state.js';
import type { NoteListItem } from './note-list.js';

/** Bind card menu item actions [绑定卡片菜单项动作] */
export function bindCardMenu(li: HTMLElement, note: NoteListItem): void {
  const menu = li.querySelector('.note-more-menu');
  if (!menu) return;

  menu.addEventListener('click', async (e: Event) => {
    e.stopPropagation();
    const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    closeAllMenus();
    if (action === 'select') {
      enterSelectionMode();
      toggleSelect(note.id);
    } else if (action === 'pin') {
      await togglePinNote(note.id);
    } else if (action === 'star') {
      await toggleStarNote(note.id);
    } else if (action === 'tags') {
      await editTagsNote(note.id);
    } else if (action === 'history') {
      await showNoteHistory(note.id);
    } else if (action === 'info') {
      await showNoteInfo(note.id);
    }
  });
}
