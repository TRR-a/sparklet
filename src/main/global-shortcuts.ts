// Global (system-wide) shortcuts [系统级全局快捷键]
// Registered with Electron's globalShortcut so they fire even when no app window
// is focused. Alt+Space alone is the OS window menu on Windows, so we use Ctrl+Alt+Space.
// [经 Electron globalShortcut 注册，即使应用窗口未聚焦也能触发。
//  Windows 上 Alt+Space 是系统窗口菜单，故用 Ctrl+Alt+Space]

import { app, globalShortcut, BrowserWindow } from 'electron';
import { getKernelWindow } from './windows/window-manager';
import { logger } from './services/logger';

/**
 * Toggle the kernel (Hub) window: show+focus if hidden, minimize if visible
 * [切换内核 (Hub) 窗口：隐藏则显示并聚焦，显示则最小化]
 */
function toggleKernelWindow(): void {
  const win = getKernelWindow();
  if (!win || win.isDestroyed()) return;
  if (win.isMinimizable() && (win.isMinimized() || !win.isVisible())) {
    win.show();
    win.focus();
  } else {
    win.minimize();
  }
}

/**
 * Broadcast a "new note" intent to all open windows (the note plugin listens
 * and creates a note; other windows ignore it)
 * [向所有打开的窗口广播"新建笔记"意图 (note 插件监听并新建，其他窗口忽略)]
 */
function broadcastNewNote(): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.webContents.send('global:new-note');
  });
  logger.info('main', 'Global shortcut: new-note broadcast');
}

/**
 * Register system-wide shortcuts (call after app.whenReady) [注册系统级快捷键 (在 app.whenReady 后调用)]
 */
export function registerGlobalShortcuts(): void {
  // Toggle kernel window [切换内核窗口]
  const toggleKernel = globalShortcut.register('Control+Alt+Space', () => {
    toggleKernelWindow();
  });
  if (!toggleKernel) logger.warn('main', 'Failed to register Ctrl+Alt+Space');

  // New note (broadcast to note plugin) [新建笔记 (广播给 note 插件)]
  const newNote = globalShortcut.register('Control+Alt+N', () => {
    broadcastNewNote();
  });
  if (!newNote) logger.warn('main', 'Failed to register Ctrl+Alt+N');

  logger.info('main', 'Global shortcuts registered: Ctrl+Alt+Space, Ctrl+Alt+N');

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
