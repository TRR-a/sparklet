// Update cache IPC handlers [更新包缓存 IPC 处理器]
// Handles update cache info query, retention days get/set, and cache clearing [处理更新包缓存信息查询、保留天数读写、缓存清空]
//
// Split out [已拆分]：normalize → update-cache-retention-util.ts,
// info query → update-cache-info-handler.ts,
// retention get/set → update-cache-retention-handler.ts,
// clear-all → update-cache-clear-handler.ts.

import { registerUpdateCacheInfoHandler } from 'sparklet/main/ipc/update/cache/update-cache-info-handler.js';
import { registerUpdateCacheRetentionHandlers } from 'sparklet/main/ipc/update/cache/update-cache-retention-handler.js';
import { registerUpdateCacheClearHandler } from 'sparklet/main/ipc/update/cache/update-cache-clear-handler.js';

/**
 * Register update cache IPC handlers [注册更新包缓存 IPC 处理器]
 */
export function registerUpdateCacheIpcHandlers(): void {
  registerUpdateCacheInfoHandler();
  registerUpdateCacheRetentionHandlers();
  registerUpdateCacheClearHandler();
}
