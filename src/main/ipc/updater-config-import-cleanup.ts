// Updater config import: retention cleanup [更新配置导入 - 保留期清理]

import * as cacheManager from '../updater/cache/cache-manager.js';

/** Kick off a non-critical cleanup when the imported retention changed [导入的保留期变化后启动一次非关键清理] */
export function scheduleRetentionCleanup(retentionDays: number): void {
  setImmediate(() => {
    cacheManager.cleanupExpired(retentionDays).catch(e => {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('[Main] Import retention changed, cleanup failed (non-critical):', msg);
    });
  });
}
