// Main process entry point [主进程入口]
// Orchestrates app lifecycle: migration, window creation, updater initialization, IPC registration [编排应用生命周期：迁移、窗口创建、更新模块初始化、IPC 注册]

import { app, BrowserWindow } from 'electron';
import { migrateFromStore } from './services/migration-service';
import { createMainWindow } from './windows/main-window';
import { getMainWindow } from './windows/window-manager';
import { initUpdater, checkUpdateManually } from './updater';
import { registerAllIpcHandlers } from './ipc';
import { registerDevToolsShortcut } from './ipc/window-ipc';

/**
 * Application lifecycle: ready [应用生命周期：就绪]
 */
app.whenReady().then(async () => {
  // 1. Run migration first (ensure data is persisted) [先执行迁移 (确保数据落盘)]
  await migrateFromStore();

  // 2. Register all IPC handlers [注册所有 IPC 处理器]
  registerAllIpcHandlers();

  // 2.1 Register Ctrl+Shift+I shortcut for DevTools (covers all windows) [注册 Ctrl+Shift+I 快捷键用于开发者工具 (覆盖所有窗口)]
  registerDevToolsShortcut();

  // 3. Create main window [创建主窗口]
  createMainWindow();

  // 4. Initialize updater module (after window creation) [初始化更新模块 (窗口创建后执行)]
  initUpdater();

  // 5. Auto check for updates after 3s (non-blocking startup) [延迟 3 秒后自动检查更新 (不阻塞启动)]
  setTimeout(() => {
    checkUpdateManually();
  }, 3000);
});

/**
 * Application lifecycle: window-all-closed [应用生命周期：所有窗口关闭]
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Application lifecycle: activate (macOS) [应用生命周期：激活 (macOS)]
 */
app.on('activate', () => {
  if (getMainWindow() === null) {
    createMainWindow();
  }
});

// Prevent creating additional garbage collection references [防止创建额外的 GC 引用]
export { BrowserWindow };
