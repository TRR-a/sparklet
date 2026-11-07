// Updater dialog: find an available window [更新器弹窗 - 查找可用窗口]

import { BrowserWindow } from 'electron';

/**
 * Find an available BrowserWindow (prefer focused window, then any window) [找一个可用的 BrowserWindow (优先聚焦窗口，其次任意窗口)]
 */
export function findAvailableWindow(): BrowserWindow | null {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused && !focused.isDestroyed()) return focused;
  const all = BrowserWindow.getAllWindows().filter(w => !w.isDestroyed());
  return all.length > 0 ? all[0] : null;
}
