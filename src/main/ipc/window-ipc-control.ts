// Window IPC: control channels [窗口 IPC - 控制通道]

import { app, ipcMain, BrowserWindow } from 'electron';

/** Register window control IPC handlers [注册窗口控制 IPC 处理器] */
export function registerWindowControlIpc(): void {
  // ========== Window control [窗口控制] ==========
  ipcMain.handle('window-minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
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

  ipcMain.handle('window-close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  // ========== App quit (from exit-confirm dialog, after saving) [应用退出 (退出确认弹窗用，保存后调用)] ==========
  ipcMain.handle('app-quit', () => {
    app.quit();
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
}
