// Update cache: get-info handler [更新缓存 - 信息查询处理器]

import { ipcMain } from 'electron';
import * as cacheManager from 'sparklet/main/updater/cache/cache-manager.js';
import { getConfigItem } from 'sparklet/main/updater/config/config-manager.js';

/** Register the cache-info IPC handler [注册缓存信息 IPC 处理器] */
export function registerUpdateCacheInfoHandler(): void {
  // ========== Get cache info [获取缓存信息] ==========
  ipcMain.handle('update-cache:get-info', async () => {
    try {
      let retentionDays: number | null = null;
      try {
        retentionDays = await getConfigItem('cacheRetentionDays') as number | null;
      } catch { /* ignore [忽略] */ }
      const info = await cacheManager.getLatestCacheInfo(retentionDays);
      return { success: true, info };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Main] getUpdateCacheInfo failed:', msg);
      return { success: false, error: msg };
    }
  });
}
