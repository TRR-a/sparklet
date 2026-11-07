// DOM utils: date formatting [DOM 工具 - 日期格式化]

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
