// IPC handlers entry point [IPC 处理器入口]
// Registers all IPC handlers grouped by domain [按域分组注册所有 IPC 处理器]

import { registerNotesIpcHandlers } from 'sparklet/main/ipc/notes/notes-ipc.js';
import { registerStoreIpcHandlers } from 'sparklet/main/ipc/store-ipc.js';
import { registerWindowIpcHandlers } from 'sparklet/main/ipc/window/window-ipc.js';
import { registerBroadcastIpcHandlers } from 'sparklet/main/ipc/app/broadcast-ipc.js';
import { registerUpdaterIpcHandlers } from 'sparklet/main/ipc/update/ipc/updater-ipc.js';
import { registerUpdaterConfigIpcHandlers } from 'sparklet/main/ipc/update/config/updater-config-ipc.js';
import { registerUpdateCacheIpcHandlers } from 'sparklet/main/ipc/update/cache/update-cache-ipc.js';
import { registerProjectIpcHandlers } from 'sparklet/main/ipc/project-ipc.js';
import { registerSystemIpcHandlers } from 'sparklet/main/ipc/app/system-ipc.js';
import { registerLoggerIpc } from 'sparklet/main/ipc/app/logger-ipc.js';
import { registerLogsIpcHandlers } from 'sparklet/main/ipc/app/logs-ipc.js';

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
