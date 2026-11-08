// Note card: card body click [笔记卡片 - 卡片主体点击]

import { isSelectionMode, toggleSelect } from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-state.js';
import type { NoteListItem } from 'sparklet/renderer/app/popup/note/list/scripts/note-list.js';

/** Bind card body click: select in multi-select mode, else open/close the note [绑定卡片主体点击：多选模式选中，否则打开/关闭笔记] */
export function bindCardClick(li: HTMLElement, note: NoteListItem): void {
  li.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.note-more-btn') || target.closest('.note-more-menu') || target.closest('.note-delete-btn')) return;
    // Multi-select mode: toggle selection instead of opening the note [多选模式：切换选中而非打开笔记]
    if (isSelectionMode()) {
      toggleSelect(note.id);
      return;
    }
    // Toggle: clicking the already-open note closes it [切换：点击已打开的笔记则关闭]
    void import('sparklet/renderer/app/popup/editor/scripts/note-editor.js').then(({ switchNote, closeNote, getCurrentNoteId }) => {
      if (note.id === getCurrentNoteId()) void closeNote();
      else void switchNote(note.id);
    });
  });
}
