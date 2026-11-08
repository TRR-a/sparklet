// Cache info: empty-cache shape [缓存信息 - 空缓存结构]

import { formatBytes } from './cache-size-format.js';
import type { CacheInfo } from 'sparklet/shared/types/updater/updater.js';

/** Build the "no cache" info object [构造「无缓存」信息对象] */
export function buildEmptyCacheInfo(): CacheInfo {
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
