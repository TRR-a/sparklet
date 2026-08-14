// Broadcast IPC handlers [广播 IPC 处理器]
// Handles language and theme change broadcasts to all windows [处理语言和主题切换广播到所有窗口]

import { ipcMain, BrowserWindow } from 'electron';

/**
 * Register broadcast IPC handlers (language/theme) [注册广播 IPC 处理器 (语言/主题)]
 */
export function registerBroadcastIpcHandlers(): void {
  // ========== Multi-language broadcast [多语言广播] ==========
  ipcMain.handle('language-changed', (_event, lang: string) => {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('language-broadcast', lang);
      }
    });
  });

  // ========== Theme switch broadcast [主题切换广播] ==========
  ipcMain.handle('theme-changed', (_event, theme: string) => {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('theme-broadcast', theme);
      }
    });
  });
}
