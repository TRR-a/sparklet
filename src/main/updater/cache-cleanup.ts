// Cache cleanup & info - clean expired cache, clear all/by-version, aggregate info for settings page [缓存清理与信息 - 清理过期缓存、清空全部/按版本、聚合信息供设置页展示]

import {
  DEFAULT_CACHE_SUCCESS_RETENTION_DAYS,
  CACHE_UNUSED_RETENTION_DAYS,
  CACHE_MAX_VERSIONS
} from './constants';
import { readMeta, writeMeta, removeVersionCache } from './cache-meta';
import { getLatestCacheInfo as computeLatestCacheInfo } from './cache-info';
import type { CacheInfo } from '../../shared/types/updater';

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
    let expireMs: number;
    let baseline: number;
    if (entry.successFirstLaunchAt) {
      baseline = new Date(entry.successFirstLaunchAt).getTime();
      expireMs = okDays * 24 * 60 * 60 * 1000;
    } else {
      baseline = new Date(entry.downloadedAt).getTime();
      expireMs = CACHE_UNUSED_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    }
    if (now - baseline > expireMs) {
      await removeVersionCache(meta, version);
      removedCount++;
    }
  }

  // Round 2: delete oldest by count limit (prioritize never-launched) [第 2 轮：按数量上限删最老的 (优先删未成功打开的)]
  const remaining = Object.keys(meta.versions)
    .map(v => ({
      v,
      hasSuccess: !!meta.versions[v].successFirstLaunchAt,
      t: new Date(meta.versions[v].downloadedAt).getTime()
    }))
    .sort((a, b) => {
      if (a.hasSuccess !== b.hasSuccess) return a.hasSuccess ? 1 : -1;
      return a.t - b.t;
    });
  if (remaining.length > CACHE_MAX_VERSIONS) {
    const toRemove = remaining.slice(0, remaining.length - CACHE_MAX_VERSIONS);
    for (const item of toRemove) {
      await removeVersionCache(meta, item.v);
      removedCount++;
    }
  }

  if (removedCount > 0) {
    await writeMeta(meta);
  }
  console.log('[CacheManager] cleanupExpired done, removed:', removedCount);
  return removedCount;
}

/**
 * Clear all cache immediately (settings page button) [立即清空全部缓存 (设置页按钮)]
 */
export async function clearAllCache(): Promise<boolean> {
  const meta = await readMeta();
  const versions = Object.keys(meta.versions);
  for (const v of versions) {
    await removeVersionCache(meta, v);
  }
  meta.versions = {};
  await writeMeta(meta);
  console.log('[CacheManager] All cache cleared');
  return true;
}

/**
 * Delete cache for a specific version (finer-grained option for settings page, currently only full delete is used) [删除指定版本的缓存 (设置页更细粒度可选，目前只用全部删除)]
 */
export async function clearCacheByVersion(version: string): Promise<boolean> {
  const meta = await readMeta();
  if (!meta.versions[version]) return false;
  await removeVersionCache(meta, version);
  await writeMeta(meta);
  return true;
}

/**
 * Get cache info of the "latest version" (settings page only shows the latest one) [取「最新的一个版本」的缓存信息 (设置页只展示最新的那一个)]
 * Reads meta then delegates to cache-info.ts for computation [读取 meta 后委托给 cache-info.ts 计算]
 * @param successRetentionDays Retention days after successful launch (7~30, from config; default 7 if omitted) [成功打开后的保留天数 (7~30，由配置传入；缺省用默认 7 天)]
 */
export async function getLatestCacheInfo(successRetentionDays?: number | null): Promise<CacheInfo> {
  const meta = await readMeta();
  return computeLatestCacheInfo(meta, successRetentionDays);
}
