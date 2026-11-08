// Welcome settings window: overlap sync with hub [欢迎设置窗口 - 与 Hub 的重叠同步]

import { BrowserWindow } from 'electron';
import { getWelcomeWindow } from '../window-manager.js';

/**
 * Compute whether the settings window overlaps the welcome window and notify
 * the hub renderer so it can blur/unblur its content.
 * [计算设置窗口是否与 Welcome 窗口重叠并通知 Hub 渲染层虚化/解除]
 */
export function syncHubOverlap(settingsWindow: BrowserWindow | null): void {
  const hub = getWelcomeWindow();
  if (!hub || hub.isDestroyed() || !settingsWindow || settingsWindow.isDestroyed()) return;
  const h = hub.getBounds();
  const s = settingsWindow.getBounds();
  const overlapping = !(
    s.x + s.width < h.x ||
    s.x > h.x + h.width ||
    s.y + s.height < h.y ||
    s.y > h.y + h.height
  );
  hub.webContents.send('welcome-settings-overlap', overlapping);
}

/** Send an explicit "not overlapping" to the hub (minimize / close) [向 Hub 显式发送「不重叠」(最小化/关闭)] */
export function clearHubOverlap(): void {
  const hub = getWelcomeWindow();
  if (hub && !hub.isDestroyed()) hub.webContents.send('welcome-settings-overlap', false);
}
