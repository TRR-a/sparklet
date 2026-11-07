// Global shortcuts: actions [全局快捷键 - 触发动作]

import { BrowserWindow, globalShortcut } from 'electron';
import { getWelcomeWindow } from '../windows/window-manager';
import { logger } from '../services/logger';

/**
 * Toggle the Welcome window: show+focus if hidden, minimize if visible
 * [切换 Welcome 窗口：隐藏则显示并聚焦，显示则最小化]
 */
export function toggleHubWindow(): void {
  const win = getWelcomeWindow();
  if (!win || win.isDestroyed()) return;
  if (win.isMinimizable() && (win.isMinimized() || !win.isVisible())) {
    win.show();
    win.focus();
  } else {
    win.minimize();
  }
}

/**
 * Broadcast a "new note" intent to all open windows (the official Main window
 * listens and creates a note; other windows ignore it)
 * [向所有打开的窗口广播"新建笔记"意图 (官方 Main 窗口监听并新建，其他窗口忽略)]
 */
export function broadcastNewNote(): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.webContents.send('global:new-note');
  });
  logger.info('main', 'Global shortcut: new-note broadcast');
}

/** Unregister everything when the app quits [应用退出时注销全部快捷键] */
export function unregisterOnQuit(): void {
  globalShortcut.unregisterAll();
}
