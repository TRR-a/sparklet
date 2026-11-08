// Shortcut panel - keyboard shortcut cheat-sheet modal [快捷键面板 - 键盘快捷键速查弹窗]
//
// Opens via the ⌨️ title-bar button, F1 (bound in global-shortcuts.ts) or this module's
// toggle; closes via Esc, overlay click or the close button [经标题栏 ⌨️ 按钮、F1 (在
// global-shortcuts.ts 绑定) 或本模块的切换函数打开；Esc、点遮罩或关闭按钮关闭]
//
// Split out [已拆分]：data → shortcut-panel-data.ts, view → shortcut-panel-view.ts.

import { getModal, hidePanel, isPanelOpen, showPanel } from 'sparklet/renderer/app/popup/modals/shortcut/scripts/shortcut-panel-view.js';

/**
 * Toggle the shortcut panel [切换快捷键面板]
 */
export function toggleShortcutPanel(): void {
  if (isPanelOpen()) hidePanel();
  else showPanel();
}

/**
 * Bind shortcut panel events (call once on init) [绑定快捷键面板事件 (初始化时调用一次)]
 */
export function initShortcutPanel(): void {
  const btn = document.getElementById('shortcutBtn');
  if (btn) btn.addEventListener('click', toggleShortcutPanel);

  const closeBtn = document.getElementById('shortcutPanelCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', hidePanel);

  const modal = getModal();
  if (modal) {
    // Overlay click closes (target = overlay itself, not the box) [点击遮罩关闭 (仅遮罩本体，不含弹窗主体)]
    modal.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target === modal) hidePanel();
    });
  }

  // Esc closes the panel (capture phase, before the double-Esc exit detector) [Esc 关闭面板 (capture 阶段，先于双击 Esc 退出检测)]
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isPanelOpen()) {
      e.preventDefault();
      e.stopPropagation();
      hidePanel();
    }
  }, true);
}
