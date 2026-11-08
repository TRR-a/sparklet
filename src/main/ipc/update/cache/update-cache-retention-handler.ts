// Update cache: retention days get/set handlers [更新缓存 - 保留天数读写处理器]

import { ipcMain } from 'electron';
import * as cacheManager from 'sparklet/main/updater/cache/cache-manager.js';
import { getConfigItem, setConfigItem } from 'sparklet/main/updater/config/config-manager.js';
import { DEFAULT_CACHE_SUCCESS_RETENTION_DAYS } from 'sparklet/main/updater/constants/constants.js';
import { normalizeRetentionDays } from 'sparklet/main/ipc/update/cache/update-cache-retention-util.js';

/** Register the retention-days IPC handlers [注册保留天数 IPC 处理器] */
export function registerUpdateCacheRetentionHandlers(): void {
  // ========== Get retention days [获取保留天数] ==========
  ipcMain.handle('update-cache:get-retention-days', async () => {
    try {
      let days: number | null = null;
      try {
        days = await getConfigItem('cacheRetentionDays') as number | null;
      } catch { /* ignore [忽略] */ }
      return { success: true, days: normalizeRetentionDays(days) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Main] getRetentionDays failed:', msg);
      return { success: false, days: DEFAULT_CACHE_SUCCESS_RETENTION_DAYS, error: msg };
    }
  });

  // ========== Set retention days [设置保留天数] ==========
  ipcMain.handle('update-cache:set-retention-days', async (_event, rawDays: unknown) => {
    try {
      const clamped = normalizeRetentionDays(rawDays);
      await setConfigItem('cacheRetentionDays', clamped);
      setImmediate(() => {
        cacheManager.cleanupExpired(clamped).catch(e => {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn('[Main] Retention changed, cleanup failed (non-critical):', msg);
        });
      });
      return { success: true, days: clamped };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Main] setRetentionDays failed:', msg);
      return { success: false, error: msg };
    }
  });
}
