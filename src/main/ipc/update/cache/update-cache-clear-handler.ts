// Update cache: clear-all handler [更新缓存 - 清空处理器]

import { ipcMain } from 'electron';
import * as cacheManager from 'sparklet/main/updater/cache/cache-manager.js';

/** Register the cache-clear IPC handler [注册缓存清空 IPC 处理器] */
export function registerUpdateCacheClearHandler(): void {
  // ========== Clear all cache [清空所有缓存] ==========
  ipcMain.handle('update-cache:clear-all', async () => {
    try {
      await cacheManager.clearAllCache();
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Main] clearUpdateCache failed:', msg);
      return { success: false, error: msg };
    }
  });
}
