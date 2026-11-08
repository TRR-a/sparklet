// Markdown table: alignment parsing [Markdown 表格 - 对齐解析]

import { parseTableRow } from 'sparklet/renderer/shared/markdown/table/markdown-table-row.js';

/** Parse alignment from the separator row [从分隔行解析各列对齐方式] */
export function parseTableAligns(separator: string): Array<'left' | 'center' | 'right'> {
  return parseTableRow(separator).map((cell: string) => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    return 'left';
  });
}
