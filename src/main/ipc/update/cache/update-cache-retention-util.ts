// Update cache: retention day normalization [更新缓存 - 保留天数规范化]

import {
  CACHE_RETENTION_MIN_DAYS,
  CACHE_RETENTION_MAX_DAYS,
  DEFAULT_CACHE_SUCCESS_RETENTION_DAYS
} from 'sparklet/main/updater/constants/constants.js';

/**
 * Normalize retention days to valid range [min, max] as integer [规范化保留天数到合法范围 [min, max] 并取整]
 */
export function normalizeRetentionDays(days: unknown): number {
  const n = Number(days);
  if (!Number.isFinite(n)) return DEFAULT_CACHE_SUCCESS_RETENTION_DAYS;
  return Math.max(CACHE_RETENTION_MIN_DAYS, Math.min(CACHE_RETENTION_MAX_DAYS, Math.round(n)));
}
