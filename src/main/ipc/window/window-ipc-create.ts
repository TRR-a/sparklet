// Window IPC: window creation channels [窗口 IPC - 窗口创建通道]

import { ipcMain } from 'electron';
import { createSettingsWindow } from '../../windows/settings/settings-window.js';
import { createAboutWindow } from '../../windows/about-window.js';
import { createWelcomeSettingsWindow } from '../../windows/settings/welcome-settings-window.js';
import { createMainWindow } from '../../windows/main-window.js';
import { getSettingsWindow } from '../../windows/window-manager.js';

/** Register window creation IPC handlers [注册窗口创建 IPC 处理器] */
export function registerWindowCreateIpc(): void {
  // ========== Window creation [窗口创建] ==========
  ipcMain.handle('open-settings-window', () => {
    createSettingsWindow();
  });

  ipcMain.handle('open-about-window', () => {
    createAboutWindow();
  });

  // ========== Official Main window [官方 Main 窗口] ==========
  ipcMain.handle('open-main-window', () => {
    createMainWindow();
  });

  // ========== Hub settings window [Hub 设置窗口] ==========
  ipcMain.handle('open-welcome-settings-window', () => {
    createWelcomeSettingsWindow();
  });

  // ========== Settings window status query [设置窗口状态查询] ==========
  ipcMain.handle('is-settings-window-open', () => {
    const win = getSettingsWindow();
    return win !== null && !win.isDestroyed();
  });
}
