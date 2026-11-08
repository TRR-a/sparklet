// Trash card: restore / permanent-delete buttons [回收站卡片 - 恢复/永久删除按钮]

import { restoreFromTrash, permanentlyDeleteNote } from './trash-actions.js';
import type { NoteListItem } from '../../../note/list/scripts/note-list.js';

/** Wire restore / permanent-delete buttons [接线恢复/永久删除按钮] */
export function bindTrashCardButtons(li: HTMLElement, note: NoteListItem): void {
  const restoreBtn = li.querySelector('.restore-btn');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', async (e: Event) => {
      e.stopPropagation();
      await restoreFromTrash(note.id);
    });
  }
  const deleteBtn = li.querySelector('.permanent-delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e: Event) => {
      e.stopPropagation();
      await permanentlyDeleteNote(note.id);
    });
  }
}
