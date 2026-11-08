// Virtual list: active-note highlight sync [虚拟列表 - 选中高亮同步]

import { setActiveNoteId, cardCache } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-state.js';

/**
 * Update the active-note highlight without re-rendering [不重渲染地更新选中笔记高亮]
 * Updates both attached and cached card elements [同时更新已挂载与缓存中的卡片元素]
 */
export function syncActiveNoteInList(noteId: string | null): void {
  setActiveNoteId(noteId);
  document.querySelectorAll('#noteList .note-list-item').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('data-note-id') === noteId);
  });
  for (const el of cardCache.values()) {
    if (el.classList.contains('note-list-item')) {
      el.classList.toggle('active', el.getAttribute('data-note-id') === noteId);
    }
  }
}
