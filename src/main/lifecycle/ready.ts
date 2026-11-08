// App lifecycle: ready sequence [应用生命周期 - 就绪序列]

import { app } from 'electron';
import { migrateFromStore } from 'sparklet/main/services/migration/migration-service.js';
import { createWelcomeWindow } from 'sparklet/main/windows/welcome-window.js';
import { initUpdater, checkUpdateManually } from 'sparklet/main/updater/index.js';
import { registerAllIpcHandlers } from 'sparklet/main/ipc/index.js';
import { registerDevToolsShortcut } from 'sparklet/main/ipc/window/window-ipc.js';
import { registerGlobalShortcuts } from 'sparklet/main/bootstrap/global-shortcuts.js';
import { runStartupIntegrityScan } from 'sparklet/main/services/note/io/note-integrity.js';
import { initLogger, installCrashLogging, logger } from 'sparklet/main/services/logger/logger.js';

/**
 * Application lifecycle: ready [应用生命周期：就绪]
 */
export function registerReadyLifecycle(): void {
  app.whenReady().then(async () => {
    initLogger();
    // Crash capture: main/renderer/child-process failures + session-end marker
    // [崩溃捕获：主进程/渲染进程/子进程故障 + 会话结束标记]
    installCrashLogging();

    // 1. Run migration first (ensure data is persisted) [先执行迁移 (确保数据落盘)]
    await migrateFromStore();
    logger.info('main', 'Migration done');

    // 1.1 Startup integrity scan: clean tmp leftovers, repair corrupt note files
    // from history snapshots (before any renderer can query notes)
    // [启动完整性扫描：清理临时残留，从历史快照修复损坏笔记 (先于任何渲染进程查询)]
    await runStartupIntegrityScan();
    logger.info('main', 'Startup integrity scan done');

    // 2. Register all IPC handlers [注册所有 IPC 处理器]
    registerAllIpcHandlers();

    // 2.1 Register Ctrl+Shift+I shortcut for DevTools (covers all windows) [注册 Ctrl+Shift+I 快捷键用于开发者工具 (覆盖所有窗口)]
    registerDevToolsShortcut();

    // 3. Create the Welcome window. The official Main UI is part of the
    //    kernel bundle and is opened on demand via open-main-window.
    //    [创建 Welcome 窗口。官方 Main 界面已并入内核包，按需经 open-main-window 打开]
    createWelcomeWindow();
    logger.info('main', 'Welcome window created');

    // 2.2 Register system-wide global shortcuts (Ctrl+Alt+Space toggle kernel, Ctrl+Alt+N new note)
    // [注册系统级全局快捷键 (Ctrl+Alt+Space 切换内核，Ctrl+Alt+N 新建笔记)]
    registerGlobalShortcuts();

    // 4. Initialize updater module (after window creation) [初始化更新模块 (窗口创建后执行)]
    initUpdater();

    // 5. Auto check for updates after 3s (non-blocking startup) [延迟 3 秒后自动检查更新 (不阻塞启动)]
    setTimeout(() => {
      logger.debug('main', 'Delayed update check fired');
      checkUpdateManually();
    }, 3000);
  });
}
