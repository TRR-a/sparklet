// IPC handlers entry point [IPC 处理器入口]
// Registers all IPC handlers grouped by domain [按域分组注册所有 IPC 处理器]

import { registerNotesIpcHandlers } from './notes/notes-ipc.js';
import { registerStoreIpcHandlers } from './store-ipc';
import { registerWindowIpcHandlers } from './window/window-ipc.js';
import { registerBroadcastIpcHandlers } from './app/broadcast-ipc.js';
import { registerUpdaterIpcHandlers } from './update/ipc/updater-ipc.js';
import { registerUpdaterConfigIpcHandlers } from './update/config/updater-config-ipc.js';
import { registerUpdateCacheIpcHandlers } from './update/cache/update-cache-ipc.js';
import { registerProjectIpcHandlers } from './project-ipc';
import { registerSystemIpcHandlers } from './app/system-ipc.js';
import { registerLoggerIpc } from './app/logger-ipc.js';
import { registerLogsIpcHandlers } from './app/logs-ipc.js';

/**
 * Register all IPC handlers (notes, store, window, broadcast, updater, config, cache, system) [注册所有 IPC 处理器 (笔记、存储、窗口、广播、更新、配置、缓存、系统)]
 */
export function registerAllIpcHandlers(): void {
  registerNotesIpcHandlers();
  registerStoreIpcHandlers();
  registerWindowIpcHandlers();
  registerBroadcastIpcHandlers();
  registerUpdaterIpcHandlers();
  registerUpdaterConfigIpcHandlers();
  registerUpdateCacheIpcHandlers();
  registerProjectIpcHandlers();
  registerSystemIpcHandlers();
  registerLoggerIpc();
  registerLogsIpcHandlers();
  console.log('[IPC] All IPC handlers registered');
}
