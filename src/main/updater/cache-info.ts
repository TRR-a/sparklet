// Cache info aggregation for settings page display [缓存信息聚合，供设置页展示]
// Reads cache meta and computes display-ready info (size, retention, remaining days) [读取缓存 meta 并计算展示用信息 (大小、保留策略、剩余天数)]

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  getUpdateCacheDir,
  DEFAULT_CACHE_SUCCESS_RETENTION_DAYS,
  CACHE_UNUSED_RETENTION_DAYS
} from './constants';
import type { CacheMeta, CacheInfo } from '../../shared/types/updater';

/**
 * Get file size of a single ZIP in directory (bytes) [计算目录下单个 ZIP 的大小 (字节)]
 */
async function getFileSize(filePath: string): Promise<number> {
  try {
    const stat = await fs.stat(filePath);
    return stat.size || 0;
  } catch {
    return 0;
  }
}

/**
 * Format bytes to human-readable string [格式化字节数为可读字符串]
 */
function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Take cache info of the "latest version" (settings page only shows the latest one) [取「最新的一个版本」的缓存信息 (设置页只展示最新的那一个)]
 * @param meta Cache metadata (passed in to avoid circular dependency with cache-manager) [缓存元数据 (传入以避免与 cache-manager 循环依赖)]
 * @param successRetentionDays Retention days after successful launch (7~30, from config; default 7 if omitted) [成功打开后的保留天数 (7~30，由配置传入；缺省用默认 7 天)]
 */
export async function getLatestCacheInfo(
  meta: CacheMeta,
  successRetentionDays?: number | null
): Promise<CacheInfo> {
  const okDays = Number.isFinite(successRetentionDays as number) && (successRetentionDays as number) > 0
    ? successRetentionDays as number
    : DEFAULT_CACHE_SUCCESS_RETENTION_DAYS;

  const versions = Object.keys(meta.versions);
  if (versions.length === 0) {
    return {
      hasCache: false,
      version: null,
      zipFilename: null,
      sizeBytes: 0,
      sizeFormatted: formatBytes(0),
      downloadedAt: null,
      successFirstLaunchAt: null,
      retentionStrategy: null,
      retentionDays: null,
      remainingDays: null,
      totalCachedVersions: 0
    };
  }

  // Take latest by downloadedAt descending [按 downloadedAt 降序取最新的]
  const sorted = versions
    .map(v => ({ v, entry: meta.versions[v] }))
    .sort((a, b) => new Date(b.entry.downloadedAt).getTime() - new Date(a.entry.downloadedAt).getTime());
  const latest = sorted[0];
  const entry = latest.entry;

  const zipPath = path.join(getUpdateCacheDir(), entry.zipFilename);
  const sizeBytes = await getFileSize(zipPath);

  const now = Date.now();
  let retentionStrategy: string | null = null;
  let retentionDays: number | null = null;
  let remainingDays: number | null = null;
  if (entry.successFirstLaunchAt) {
    retentionStrategy = `success-${okDays}d`;
    retentionDays = okDays;
    const baseline = new Date(entry.successFirstLaunchAt).getTime();
    const elapsedMs = now - baseline;
    const totalMs = okDays * 24 * 60 * 60 * 1000;
    remainingDays = Math.max(0, (totalMs - elapsedMs) / (24 * 60 * 60 * 1000));
  } else {
    retentionStrategy = `unused-${CACHE_UNUSED_RETENTION_DAYS}d`;
    retentionDays = CACHE_UNUSED_RETENTION_DAYS;
    const baseline = new Date(entry.downloadedAt).getTime();
    const elapsedMs = now - baseline;
    const totalMs = CACHE_UNUSED_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    remainingDays = Math.max(0, (totalMs - elapsedMs) / (24 * 60 * 60 * 1000));
  }

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
