// Global DevTools shortcut [全局开发者工具快捷键]

import { app, BrowserWindow } from 'electron';

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
