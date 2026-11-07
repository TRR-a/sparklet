// Cache retention constants and normalization [缓存保留天数常量与归一化]

// Retention days config [保留天数配置]
export const RETENTION_MIN = 7;
export const RETENTION_MAX = 30;
export const RETENTION_DEFAULT = 7;

/**
 * Normalize retention days to valid range [min, max] as integer [规范化保留天数到合法范围 [min, max] 并取整]
 */
export function clampRetentionDays(days: unknown): number {
  const n = Number(days);
  if (!Number.isFinite(n)) return RETENTION_DEFAULT;
  return Math.max(RETENTION_MIN, Math.min(RETENTION_MAX, Math.round(n)));
}
