// Main process entry point [主进程入口]
// Orchestrates app lifecycle: migration, window creation, updater initialization, IPC registration [编排应用生命周期：迁移、窗口创建、更新模块初始化、IPC 注册]

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { migrateFromStore } from './services/migration-service';
import { createKernelWindow } from './windows/kernel-window';
import { getKernelWindow } from './windows/window-manager';
import { initUpdater, checkUpdateManually } from './updater';
import { registerAllIpcHandlers } from './ipc';
import { registerDevToolsShortcut } from './ipc/window-ipc';
import { runStartupIntegrityScan } from './services/note-integrity';

// Development: redirect userData to project-local app_data/sparklet-dev/ so dev data
// (notes, config, update cache, logs) stays isolated from the production profile.
// Must run before app.whenReady() so all getPath('userData') callers pick it up.
// [开发环境：将 userData 重定向到项目内 app_data/sparklet-dev/，使开发数据 (笔记/配置/更新缓存/日志)
// 与生产环境配置隔离。必须在 app.whenReady() 前执行，所有 getPath('userData') 调用方才能生效]
if (!app.isPackaged) {
  const devDataDir = path.join(app.getAppPath(), 'app_data', 'sparklet-dev');
  fs.mkdirSync(devDataDir, { recursive: true });
  app.setPath('userData', devDataDir);
  console.log('[Dev] userData redirected to:', devDataDir);
}

/**
 * Application lifecycle: ready [应用生命周期：就绪]
 */
app.whenReady().then(async () => {
  // 1. Run migration first (ensure data is persisted) [先执行迁移 (确保数据落盘)]
  await migrateFromStore();

  // 1.1 Startup integrity scan: clean tmp leftovers, repair corrupt note files
  // from history snapshots (before any renderer can query notes)
  // [启动完整性扫描：清理临时残留，从历史快照修复损坏笔记 (先于任何渲染进程查询)]
  await runStartupIntegrityScan();

  // 2. Register all IPC handlers [注册所有 IPC 处理器]
  registerAllIpcHandlers();

  // 2.1 Register Ctrl+Shift+I shortcut for DevTools (covers all windows) [注册 Ctrl+Shift+I 快捷键用于开发者工具 (覆盖所有窗口)]
  registerDevToolsShortcut();

  // 3. Create the kernel (Hub) window. Plugins are discovered on demand by the
  //    kernel UI via plugins:list; no plugin is required to boot.
  //    [创建内核 (Hub) 窗口。插件由内核 UI 按需经 plugins:list 发现，无需任何插件即可启动]
  createKernelWindow();

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
  if (getKernelWindow() === null) {
    createKernelWindow();
  }
});

// Prevent creating additional garbage collection references [防止创建额外的 GC 引用]
export { BrowserWindow };
