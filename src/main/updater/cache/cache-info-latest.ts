// Cache info: latest version aggregation [缓存信息 - 最新版本聚合]

import * as path from 'path';
import { getUpdateCacheDir } from 'sparklet/main/updater/startup/updater-paths.js';
import type { CacheMeta, CacheInfo } from 'sparklet/shared/types/updater/updater.js';
import { getFileSize, formatBytes } from 'sparklet/main/updater/cache/cache-size-format.js';
import { computeRetention } from 'sparklet/main/updater/cache/cache-retention-info.js';
import { buildEmptyCacheInfo } from 'sparklet/main/updater/cache/cache-info-empty.js';

/**
 * Take cache info of the "latest version" (settings page only shows the latest one) [取「最新的一个版本」的缓存信息 (设置页只展示最新的那一个)]
 * @param meta Cache metadata (passed in to avoid circular dependency with cache-manager) [缓存元数据 (传入以避免与 cache-manager 循环依赖)]
 * @param successRetentionDays Retention days after successful launch (7~30, from config; default 7 if omitted) [成功打开后的保留天数 (7~30，由配置传入；缺省用默认 7 天)]
 */
export async function getLatestCacheInfo(
  meta: CacheMeta,
  successRetentionDays?: number | null
): Promise<CacheInfo> {
  const versions = Object.keys(meta.versions);
  if (versions.length === 0) {
    return buildEmptyCacheInfo();
  }

  // Take latest by downloadedAt descending [按 downloadedAt 降序取最新的]
  const sorted = versions
    .map(v => ({ v, entry: meta.versions[v] }))
    .sort((a, b) => new Date(b.entry.downloadedAt).getTime() - new Date(a.entry.downloadedAt).getTime());
  const latest = sorted[0];
  const entry = latest.entry;

  const zipPath = path.join(getUpdateCacheDir(), entry.zipFilename);
  const sizeBytes = await getFileSize(zipPath);

  const { retentionStrategy, retentionDays, remainingDays } =
    computeRetention(entry, Date.now(), successRetentionDays);

  return {
    hasCache: true,
    version: entry.version,
    zipFilename: entry.zipFilename,
    sizeBytes,
    sizeFormatted: formatBytes(sizeBytes),
    downloadedAt: entry.downloadedAt,
    successFirstLaunchAt: entry.successFirstLaunchAt,
    retentionStrategy,
    retentionDays,
    remainingDays,
    totalCachedVersions: versions.length
  };
}
