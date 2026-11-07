// Global (system-wide) shortcuts [系统级全局快捷键]
// Registered with Electron's globalShortcut so they fire even when no app window
// is focused. Alt+Space alone is the OS window menu on Windows, so we use Ctrl+Alt+Space.
// [经 Electron globalShortcut 注册，即使应用窗口未聚焦也能触发。
//  Windows 上 Alt+Space 是系统窗口菜单，故用 Ctrl+Alt+Space]
//
// Split out [已拆分]：trigger actions → global-shortcuts-actions.ts.

import { app, globalShortcut } from 'electron';
import { logger } from '../services/logger';
import { toggleHubWindow, broadcastNewNote, unregisterOnQuit } from './global-shortcuts-actions';

/**
 * Register system-wide shortcuts (call after app.whenReady) [注册系统级快捷键 (在 app.whenReady 后调用)]
 */
export function registerGlobalShortcuts(): void {
  // Toggle welcome window [切换 Welcome 窗口]
  const toggleHub = globalShortcut.register('Control+Alt+Space', () => {
    toggleHubWindow();
  });
  if (!toggleHub) logger.warn('main', 'Failed to register Ctrl+Alt+Space');

  // New note (broadcast to official Main window) [新建笔记 (广播给官方 Main 窗口)]
  const newNote = globalShortcut.register('Control+Alt+N', () => {
    broadcastNewNote();
  });
  if (!newNote) logger.warn('main', 'Failed to register Ctrl+Alt+N');

  logger.info('main', 'Global shortcuts registered: Ctrl+Alt+Space, Ctrl+Alt+N');

  app.on('will-quit', () => {
    unregisterOnQuit();
  });
}
