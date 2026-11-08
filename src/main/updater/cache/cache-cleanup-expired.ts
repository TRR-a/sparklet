// Cache cleanup: expire by time and count [缓存清理 - 按时间与数量过期]

import {
  DEFAULT_CACHE_SUCCESS_RETENTION_DAYS,
  CACHE_MAX_VERSIONS
} from '../constants/constants.js';
import { readMeta, writeMeta, removeVersionCache } from './cache-meta.js';
import { isEntryExpired, orderVersionsForCountLimit } from './cache-expiry-policy.js';

/**
 * Clean expired cache based on retention policy [根据保留策略清理过期缓存]
 * - Has successFirstLaunchAt: expired after 7 days → delete [有 successFirstLaunchAt：超过 7 天 → 删]
 * - No successFirstLaunchAt: expired after 30 days → delete [没 successFirstLaunchAt：超过 30 天 → 删]
 * - Exceeds CACHE_MAX_VERSIONS: delete oldest [超过 CACHE_MAX_VERSIONS：删最老的]
 * @param successRetentionDays Retention days after successful launch (7~30, from config; default 7 if omitted) [成功打开后的保留天数 (7~30，由配置传入；缺省用默认 7 天)]
 */
export async function cleanupExpired(successRetentionDays?: number | null): Promise<number> {
  const okDays = Number.isFinite(successRetentionDays as number) && (successRetentionDays as number) > 0
    ? successRetentionDays as number
    : DEFAULT_CACHE_SUCCESS_RETENTION_DAYS;

  const meta = await readMeta();
  const now = Date.now();
  const versionKeys = Object.keys(meta.versions);
  let removedCount = 0;

  // Round 1: delete by time expiry [第 1 轮：按时间删过期的]
  for (const version of versionKeys) {
    const entry = meta.versions[version];
    if (!entry) continue;
    if (isEntryExpired(entry, now, okDays)) {
      await removeVersionCache(meta, version);
      removedCount++;
    }
  }

  // Round 2: delete oldest by count limit (prioritize never-launched) [第 2 轮：按数量上限删最老的 (优先删未成功打开的)]
  const remaining = orderVersionsForCountLimit(meta.versions);
  if (remaining.length > CACHE_MAX_VERSIONS) {
    const toRemove = remaining.slice(0, remaining.length - CACHE_MAX_VERSIONS);
    for (const version of toRemove) {
      await removeVersionCache(meta, version);
      removedCount++;
    }
  }

  if (removedCount > 0) {
    await writeMeta(meta);
  }
  console.log('[CacheManager] cleanupExpired done, removed:', removedCount);
  return removedCount;
}
