// Update cache IPC handlers [更新包缓存 IPC 处理器]
// Handles update cache info query, retention days get/set, and cache clearing [处理更新包缓存信息查询、保留天数读写、缓存清空]

import { ipcMain } from 'electron';
import * as cacheManager from '../updater/cache-manager';
import { getConfigItem, setConfigItem } from '../updater/config-manager';
import {
  CACHE_RETENTION_MIN_DAYS,
  CACHE_RETENTION_MAX_DAYS,
  DEFAULT_CACHE_SUCCESS_RETENTION_DAYS
} from '../updater/constants';

/**
 * Normalize retention days to valid range [min, max] as integer [规范化保留天数到合法范围 [min, max] 并取整]
 */
function normalizeRetentionDays(days: unknown): number {
  const n = Number(days);
  if (!Number.isFinite(n)) return DEFAULT_CACHE_SUCCESS_RETENTION_DAYS;
  return Math.max(CACHE_RETENTION_MIN_DAYS, Math.min(CACHE_RETENTION_MAX_DAYS, Math.round(n)));
}

/**
 * Register update cache IPC handlers [注册更新包缓存 IPC 处理器]
 */
export function registerUpdateCacheIpcHandlers(): void {
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
