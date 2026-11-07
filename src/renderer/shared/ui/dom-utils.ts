// DOM utility functions - barrel [DOM 工具函数 - 汇总出口]
// Shared helpers for DOM manipulation and formatting [DOM 操作和格式化的共享辅助函数]
//
// Split out [已拆分]：date formatting → dom-format-date.ts,
// HTML escaping → dom-escape-html.ts,
// remaining-days formatting → dom-format-days.ts.

export { formatDate, formatDateTime } from './dom-format-date.js';
export { escapeHtml } from './dom-escape-html.js';
export { formatDays } from './dom-format-days.js';
