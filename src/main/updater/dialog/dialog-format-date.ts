// Updater dialogs: date formatting [更新弹窗 - 日期格式化]

/**
 * Format date for display [格式化日期显示]
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '未知';
  try {
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  } catch {
    return String(isoString);
  }
}
