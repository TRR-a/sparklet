// Updater startup: clean expired cache [更新器启动 - 清理过期缓存]

import { getConfigItem } from './config-manager.js';
import * as cacheManager from '../cache/cache-manager.js';

/** Clean expired cache shortly after startup [启动后稍候清理过期缓存] */
export function scheduleStartupCacheCleanup(): void {
  // ========== On startup: clean expired cache ========== [启动时：清理过期缓存]
  setTimeout(async () => {
    try {
      let retentionDays: number | null = null;
      try {
        retentionDays = await getConfigItem('cacheRetentionDays') as number | null;
      } catch { /* ignore [忽略] */ }
      await cacheManager.cleanupExpired(retentionDays);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Updater] Cache cleanup failed (non-critical):', msg);
    }
  }, 1500);
}
