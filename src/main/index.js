"use strict";
// Main process entry point [主进程入口]
// Orchestrates app lifecycle: migration, window creation, updater initialization, IPC registration [编排应用生命周期：迁移、窗口创建、更新模块初始化、IPC 注册]
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserWindow = void 0;
const electron_1 = require("electron");
Object.defineProperty(exports, "BrowserWindow", { enumerable: true, get: function () { return electron_1.BrowserWindow; } });
const migration_service_1 = require("./services/migration-service");
const main_window_1 = require("./windows/main-window");
const window_manager_1 = require("./windows/window-manager");
const updater_1 = require("./updater");
const ipc_1 = require("./ipc");
/**
 * Application lifecycle: ready [应用生命周期：就绪]
 */
electron_1.app.whenReady().then(async () => {
    // 1. Run migration first (ensure data is persisted) [先执行迁移 (确保数据落盘)]
    await (0, migration_service_1.migrateFromStore)();
    // 2. Register all IPC handlers [注册所有 IPC 处理器]
    (0, ipc_1.registerAllIpcHandlers)();
    // 3. Create main window [创建主窗口]
    (0, main_window_1.createMainWindow)();
    // 4. Initialize updater module (after window creation) [初始化更新模块 (窗口创建后执行)]
    (0, updater_1.initUpdater)();
    // 5. Auto check for updates after 3s (non-blocking startup) [延迟 3 秒后自动检查更新 (不阻塞启动)]
    setTimeout(() => {
        (0, updater_1.checkUpdateManually)();
    }, 3000);
});
/**
 * Application lifecycle: window-all-closed [应用生命周期：所有窗口关闭]
 */
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
/**
 * Application lifecycle: activate (macOS) [应用生命周期：激活 (macOS)]
 */
electron_1.app.on('activate', () => {
    if ((0, window_manager_1.getMainWindow)() === null) {
        (0, main_window_1.createMainWindow)();
    }
});
//# sourceMappingURL=index.js.map