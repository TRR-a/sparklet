// Window glow sync between main and settings windows [主窗口与设置窗口之间的光晕同步]

import { getMainWindow, getSettingsWindow } from './window-registry.js';

/** Main window bounds for glow sync [主窗口边界 (光晕同步用)] */
export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Glow position sync data [光晕位置同步数据] */
export interface GlowSyncData {
  mainBounds: WindowBounds;
  settingsBounds: WindowBounds;
}

/**
 * Sync glow position between main window and settings window [同步主窗口和设置窗口之间的光晕位置]
 */
export function syncGlowPosition(): void {
  const mainWindow = getMainWindow();
  const settingsWindow = getSettingsWindow();
  if (
    mainWindow && !mainWindow.isDestroyed() &&
    settingsWindow && !settingsWindow.isDestroyed()
  ) {
    const mainBounds = mainWindow.getBounds();
    const settingsBounds = settingsWindow.getBounds();
    mainWindow.webContents.send('settings-window-moved', { mainBounds, settingsBounds });
    const isOverlapping = !(
      settingsBounds.x + settingsBounds.width < mainBounds.x ||
      settingsBounds.x > mainBounds.x + mainBounds.width ||
      settingsBounds.y + settingsBounds.height < mainBounds.y ||
      settingsBounds.y > mainBounds.y + mainBounds.height
    );
    mainWindow.webContents.send('settings-window-overlap', isOverlapping);
  }
}
