// Window IPC: devtools channels [窗口 IPC - 开发者工具通道]

import { ipcMain, BrowserWindow } from 'electron';

/** Register devtools IPC handlers [注册开发者工具 IPC 处理器] */
export function registerWindowDevToolsIpc(): void {
  // ========== Dev tools [开发者工具] ==========
  ipcMain.handle('open-dev-tools', () => {
    BrowserWindow.getFocusedWindow()?.webContents.openDevTools();
  });

  ipcMain.handle('open-dev-tools-window', () => {
    BrowserWindow.getFocusedWindow()?.webContents.openDevTools({ mode: 'detach' });
  });
}
