// DOM utils: remaining-days formatting [DOM 工具 - 剩余天数格式化]

/**
 * Format remaining days for display (supports hours for <1 day) [格式化剩余天数用于显示 (不足 1 天时显示小时)]
 */
export function formatDays(
  days: number | null | undefined,
  tFn: (key: string, params?: Record<string, string>) => string
): string {
  if (days === null || days === undefined || isNaN(days)) return '—';
  if (days < 0) return tFn('fmt.days.zero');
  if (days < 1) {
    const hours = Math.max(0, Math.round(days * 24));
    return tFn('fmt.hours.about').replace('{hours}', String(hours));
  }
  return tFn('fmt.days.about').replace('{days}', String(Math.ceil(days)));
}
