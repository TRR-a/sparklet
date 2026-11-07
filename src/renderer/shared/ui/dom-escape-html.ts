// DOM utils: HTML escaping [DOM 工具 - HTML 转义]

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
