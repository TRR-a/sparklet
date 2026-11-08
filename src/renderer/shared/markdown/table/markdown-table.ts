// Markdown table renderer [Markdown 表格渲染器]
//
// Split out [已拆分]：row parsing → markdown-table-row.ts,
// alignment parsing → markdown-table-align.ts.

import { renderInline } from 'sparklet/renderer/shared/markdown/markdown-inline.js';
import { parseTableRow } from 'sparklet/renderer/shared/markdown/table/markdown-table-row.js';
import { parseTableAligns } from 'sparklet/renderer/shared/markdown/table/markdown-table-align.js';

export { parseTableRow, isTableSeparator } from 'sparklet/renderer/shared/markdown/table/markdown-table-row.js';
export { parseTableAligns } from 'sparklet/renderer/shared/markdown/table/markdown-table-align.js';

/**
 * Render table from parsed lines [从解析行渲染表格]
 * @param lines Table lines: [header, separator, ...rows] [表格行：表头、分隔行、数据行]
 * @returns Table HTML [表格 HTML]
 */
export function renderTable(lines: string[]): string {
  const header = parseTableRow(lines[0]);
  const aligns = parseTableAligns(lines[1]);

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
