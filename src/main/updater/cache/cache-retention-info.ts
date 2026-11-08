// Cache info: retention calculation [缓存信息 - 保留期计算]

import { DEFAULT_CACHE_SUCCESS_RETENTION_DAYS, CACHE_UNUSED_RETENTION_DAYS } from 'sparklet/main/updater/constants/constants.js';
import type { CacheEntry } from 'sparklet/shared/types/updater/updater.js';

/** Retention display info [保留期展示信息] */
export interface RetentionInfo {
  retentionStrategy: string;
  retentionDays: number;
  remainingDays: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Compute retention strategy/days/remaining days for a cache entry
 * [计算缓存条目的保留策略、保留天数与剩余天数]
 */
export function computeRetention(
  entry: CacheEntry,
  now: number,
  successRetentionDays?: number | null
): RetentionInfo {
  const okDays = Number.isFinite(successRetentionDays as number) && (successRetentionDays as number) > 0
    ? successRetentionDays as number
    : DEFAULT_CACHE_SUCCESS_RETENTION_DAYS;

  if (entry.successFirstLaunchAt) {
    const baseline = new Date(entry.successFirstLaunchAt).getTime();
    const elapsedMs = now - baseline;
    const totalMs = okDays * DAY_MS;
    return {
      retentionStrategy: `success-${okDays}d`,
      retentionDays: okDays,
      remainingDays: Math.max(0, (totalMs - elapsedMs) / DAY_MS)
    };
  }

  const baseline = new Date(entry.downloadedAt).getTime();
  const elapsedMs = now - baseline;
  const totalMs = CACHE_UNUSED_RETENTION_DAYS * DAY_MS;
  return {
    retentionStrategy: `unused-${CACHE_UNUSED_RETENTION_DAYS}d`,
    retentionDays: CACHE_UNUSED_RETENTION_DAYS,
    remainingDays: Math.max(0, (totalMs - elapsedMs) / DAY_MS)
  };
}
