// DOM utility functions - shared helpers for DOM manipulation and formatting [DOM 工具函数 - DOM 操作和格式化的共享辅助函数]

/**
 * Format an ISO date string for display in note list [格式化 ISO 日期字符串用于笔记列表显示]
 * - Today: show time only (HH:MM) [今天：仅显示时间 (时:分)]
 * - Other days: show month and day [其他日期：显示月和日]
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Format an ISO date string to full datetime (YYYY-MM-DD HH:MM) [格式化 ISO 日期字符串为完整日期时间 (YYYY-MM-DD HH:MM)]
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return String(iso);
  }
}

/**
 * Escape HTML special characters to prevent XSS injection [转义 HTML 特殊字符，防止 XSS 注入]
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c: string): string => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c] as string));
}

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
