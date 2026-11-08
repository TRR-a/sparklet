// Update flow: prepare - sync zip to persistent cache [更新流程 - 准备：同步到持久缓存]

import type { ManifestEntry } from 'sparklet/shared/types/updater/updater.js';
import * as cacheManager from '../../cache/cache-manager.js';

/** Copy the verified zip into the rollback cache (non-critical) [把校验通过的 zip 写入回滚缓存 (非关键)] */
export async function runCacheSyncStep(
  latestVersion: string,
  zipPath: string,
  entry: ManifestEntry,
  onProgress?: (msg: string, percent: number) => void
): Promise<void> {
  // ========== Sync downloaded ZIP to persistent cache (for rollback/reinstall) [同步下载好的 ZIP 到持久缓存 (供回滚/重装使用)]
  onProgress && onProgress('Syncing to persistent cache...', 85);
  try {
    const versionWithV = `v${latestVersion}`;
    const packageHash = entry.packageHash || entry.hash || null;
    await cacheManager.registerCachedZip(zipPath, versionWithV, packageHash);
  } catch (err) {
    // Cache write failure doesn't affect main flow, log and continue [缓存写入失败不影响主流程，打个日志继续]
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[Updater] Failed to cache update zip (non-critical):', msg);
  }
}
