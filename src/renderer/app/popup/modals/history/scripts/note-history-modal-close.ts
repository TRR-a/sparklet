// Note history modal: show / hide / close binding [笔记历史弹窗 - 显示、隐藏与关闭绑定]

import { getHistoryModal } from './note-history-list-render.js';

/**
 * Hide note history modal [隐藏笔记历史弹窗]
 */
export function hideNoteHistory(): void {
  const modal = getHistoryModal();
  if (modal) modal.style.display = 'none';
}

/**
 * Bind history modal close handlers (call once on init) [绑定历史弹窗关闭事件 (初始化时调用一次)]
 */
export function bindNoteHistoryModalHandlers(): void {
  const modal = getHistoryModal();
  if (modal) {
    // Overlay click closes (target = overlay itself) [点击遮罩关闭 (仅遮罩本体)]
    modal.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target === modal) hideNoteHistory();
    });
  }
  const closeBtn = document.getElementById('noteHistoryCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', hideNoteHistory);
}
