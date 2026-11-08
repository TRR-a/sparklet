// Updater config import: value normalizers [更新配置导入 - 取值归一化]

import {
  CACHE_RETENTION_MIN_DAYS,
  CACHE_RETENTION_MAX_DAYS
} from '../../../updater/constants/constants.js';

/** Clamp a retention-days value into the legal range [把保留天数夹到合法区间] */
export function clampRetentionDays(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(CACHE_RETENTION_MIN_DAYS, Math.min(CACHE_RETENTION_MAX_DAYS, Math.round(n)));
}

/** Normalize a last-check timestamp to ISO, or null when absent/invalid [把上次检查时间归一化为 ISO；缺失或非法返回 null] */
export function normalizeLastCheckTime(value: unknown): { valid: boolean; iso: string | null } {
  if (value === null || value === undefined) {
    return { valid: true, iso: null };
  }
  const t = new Date(value as string).getTime();
  if (!Number.isFinite(t)) return { valid: false, iso: null };
  return { valid: true, iso: new Date(t).toISOString() };
}
