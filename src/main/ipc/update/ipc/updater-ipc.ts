// Updater IPC handlers [更新模块 IPC 处理器]
// Handles update check, status, dev environment detection, and external link opening [处理更新检查、状态、开发环境检测、外链打开]
// Check/status in updater-ipc-check.ts, app info & links in app-info-ipc.ts
// [检查与状态在 updater-ipc-check.ts，应用信息与外链在 app-info-ipc.ts]

import { registerUpdaterCheckIpc } from 'sparklet/main/ipc/update/ipc/updater-ipc-check.js';
import { registerAppInfoIpc } from 'sparklet/main/ipc/app/app-info-ipc.js';

/**
 * Register updater IPC handlers (check, status, dev, external links) [注册更新模块 IPC 处理器 (检查、状态、开发环境、外链)]
 */
export function registerUpdaterIpcHandlers(): void {
  registerUpdaterCheckIpc();
  registerAppInfoIpc();
}
