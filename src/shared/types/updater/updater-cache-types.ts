// Updater cache types [更新缓存类型]

/** Cache entry for a version [版本缓存条目] */
export interface CacheEntry {
  version: string;
  zipFilename: string;
  packageHash: string | null;
  downloadedAt: string;
  successFirstLaunchAt: string | null;
}

/** Cache metadata [缓存元数据] */
export interface CacheMeta {
  versions: Record<string, CacheEntry>;
}

/** Cache info for settings page [设置页缓存信息] */
export interface CacheInfo {
  hasCache: boolean;
  version: string | null;
  zipFilename: string | null;
  sizeBytes: number;
  sizeFormatted: string;
  downloadedAt: string | null;
  successFirstLaunchAt: string | null;
  retentionStrategy: string | null;
  retentionDays: number | null;
  remainingDays: number | null;
  totalCachedVersions: number;
}

/** Cached zip verify result [缓存 ZIP 校验结果] */
export interface VerifyCachedZipResult {
  ok: boolean;
  zipPath: string | null;
  packageHash?: string;
  reason?: string;
  actualHash?: string;
  expectedHash?: string;
}
