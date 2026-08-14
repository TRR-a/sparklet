// Window IPC handlers [窗口 IPC 处理器]
// Handles window control (minimize/maximize/close), dev tools, and window creation [处理窗口控制 (最小化/最大化/关闭)、开发者工具、窗口创建]

import { ipcMain, BrowserWindow } from 'electron';
import { createSettingsWindow } from '../windows/settings-window';
import { createAboutWindow } from '../windows/about-window';

/**
 * Register window control IPC handlers [注册窗口控制 IPC 处理器]
 */
export function registerWindowIpcHandlers(): void {
  // ========== Window control [窗口控制] ==========
  ipcMain.handle('window-minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.handle('window-close', () => {
    BrowserWindow.getFocusedWindow()?.close();
  });

  // ========== Dev tools [开发者工具] ==========
  ipcMain.handle('open-dev-tools', () => {
    BrowserWindow.getFocusedWindow()?.webContents.openDevTools();
  });

  ipcMain.handle('open-dev-tools-window', () => {
    BrowserWindow.getFocusedWindow()?.webContents.openDevTools({ mode: 'detach' });
  });

  // ========== Window creation [窗口创建] ==========
  ipcMain.handle('open-settings-window', () => {
    createSettingsWindow();
  });

  ipcMain.handle('open-about-window', () => {
    createAboutWindow();
  });
}
