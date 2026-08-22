// Window IPC handlers [窗口 IPC 处理器]
// Handles window control (minimize/maximize/close), dev tools, and window creation [处理窗口控制 (最小化/最大化/关闭)、开发者工具、窗口创建]

import { app, ipcMain, BrowserWindow } from 'electron';
import { createSettingsWindow } from '../windows/settings-window';
import { createAboutWindow } from '../windows/about-window';
import { getSettingsWindow } from '../windows/window-manager';

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

  // ========== Always on top [窗口置顶] ==========
  ipcMain.handle('window-toggle-always-on-top', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      const newState = !win.isAlwaysOnTop();
      win.setAlwaysOnTop(newState);
      return newState;
    }
    return false;
  });

  // ========== Settings window status query [设置窗口状态查询] ==========
  ipcMain.handle('is-settings-window-open', () => {
    const win = getSettingsWindow();
    return win !== null && !win.isDestroyed();
  });
}

/**
 * Register global Ctrl+Shift+I shortcut to toggle DevTools in any app window [注册全局 Ctrl+Shift+I 快捷键，在任意应用窗口切换开发者工具]
 */
export function registerDevToolsShortcut(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.on('before-input-event', (event, input) => {
      // Ctrl+Shift+I: toggle DevTools [Ctrl+Shift+I：切换开发者工具]
      if (input.type === 'keyDown' && input.control && input.shift && input.key.toLowerCase() === 'i') {
        const win = BrowserWindow.fromWebContents(contents);
        if (win) {
          if (win.webContents.isDevToolsOpened()) {
            win.webContents.closeDevTools();
          } else {
            win.webContents.openDevTools({ mode: 'detach' });
          }
          event.preventDefault();
        }
      }
    });
  });
}
