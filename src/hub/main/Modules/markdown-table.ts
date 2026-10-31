// Markdown table renderer - table, alignment, and row parsing [Markdown 表格渲染器 - 表格、对齐与行解析]

import { renderInline } from './markdown-inline.js';

/**
 * Render table from parsed lines [从解析行渲染表格]
 * @param lines Table lines: [header, separator, ...rows] [表格行：表头、分隔行、数据行]
 * @returns Table HTML [表格 HTML]
 */
export function renderTable(lines: string[]): string {
  const header = parseTableRow(lines[0]);
  const separator = lines[1];

  // Parse alignment from separator [从分隔行解析对齐方式]
  const aligns = parseTableRow(separator).map((cell: string) => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    return 'left';
  });

  let html = '<table class="md-table"><thead><tr>';
  header.forEach((cell: string, idx: number) => {
    const align = aligns[idx] || 'left';
    html += `<th style="text-align:${align}">${renderInline(cell)}</th>`;
  });
  html += '</tr></thead><tbody>';

  for (let i = 2; i < lines.length; i++) {
    const cells = parseTableRow(lines[i]);
    html += '<tr>';
    cells.forEach((cell: string, idx: number) => {
      const align = aligns[idx] || 'left';
      html += `<td style="text-align:${align}">${renderInline(cell)}</td>`;
    });
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

/**
 * Parse table row into cells [将表格行解析为单元格]
 * @param line Table row line [表格行]
 * @returns Array of cell contents [单元格内容数组]
 */
export function parseTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((cell: string) => cell.trim());
}

/**
 * Check if line is a table separator [检查行是否为表格分隔行]
 * @param line Line to check [待检查行]
 * @returns True if separator [是分隔行则返回 true]
 */
export function isTableSeparator(line: string): boolean {
  return /^[|:\s-]+$/.test(line) && line.includes('-') && line.includes('|');
}
