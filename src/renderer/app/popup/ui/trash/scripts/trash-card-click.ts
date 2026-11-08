// Trash card: click handler [回收站卡片 - 点击处理]

import { isSelectionMode, toggleSelect } from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-state.js';
import { showTrashPreview } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-actions.js';
import type { NoteListItem } from 'sparklet/renderer/app/popup/note/list/scripts/note-list.js';

/** Wire the card click: activate + preview, or toggle in multi-select [接线卡片点击：激活并预览，或多选态切换] */
export function bindTrashCardClick(li: HTMLElement, note: NoteListItem): void {
  li.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.trash-actions') || target.closest('.note-more-btn') || target.closest('.note-more-menu')) return;
    // Multi-select mode: toggle selection [多选模式：切换选中]
    if (isSelectionMode()) {
      toggleSelect(note.id);
      return;
    }
    document.querySelectorAll('.trash-view .note-list-item').forEach(item => {
      item.classList.remove('active');
    });
    li.classList.add('active');
    void showTrashPreview(note.id);
  });
}
