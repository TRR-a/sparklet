// IPC handlers entry point [IPC 处理器入口]
// Registers all IPC handlers grouped by domain [按域分组注册所有 IPC 处理器]

import { registerNotesIpcHandlers } from './notes-ipc';
import { registerStoreIpcHandlers } from './store-ipc';
import { registerWindowIpcHandlers } from './window-ipc';
import { registerBroadcastIpcHandlers } from './broadcast-ipc';
import { registerUpdaterIpcHandlers } from './updater-ipc';
import { registerUpdaterConfigIpcHandlers } from './updater-config-ipc';
import { registerUpdateCacheIpcHandlers } from './update-cache-ipc';
import { registerProjectIpcHandlers } from './project-ipc';

/**
 * Register all IPC handlers (notes, store, window, broadcast, updater, config, cache) [注册所有 IPC 处理器 (笔记、存储、窗口、广播、更新、配置、缓存)]
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
  console.log('[IPC] All IPC handlers registered');
}
