// Shortcut panel: view (render + show/hide) [快捷键面板 - 视图 (渲染与显隐)]
//
// Split out [已拆分]：content builder → shortcut-panel-content.ts.

import { buildPanelContent } from './shortcut-panel-content.js';

export { buildPanelContent } from './shortcut-panel-content.js';

/**
 * Get the modal element [获取弹窗元素]
 */
export function getModal(): HTMLElement | null {
  return document.getElementById('shortcutModal');
}

/**
 * Whether the panel is open [面板是否打开]
 */
export function isPanelOpen(): boolean {
  const modal = getModal();
  return modal !== null && modal.style.display !== 'none';
}

/**
 * Show the shortcut panel [显示快捷键面板]
 */
export function showPanel(): void {
  const modal = getModal();
  if (!modal) return;
  buildPanelContent();
  modal.style.display = 'flex';
  document.getElementById('shortcutPanelCloseBtn')?.focus();
}

/**
 * Hide the shortcut panel [隐藏快捷键面板]
 */
export function hidePanel(): void {
  const modal = getModal();
  if (modal) modal.style.display = 'none';
}
