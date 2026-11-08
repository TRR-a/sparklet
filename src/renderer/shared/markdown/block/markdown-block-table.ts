// Markdown block renderer: tables + paragraph + block-start detection [Markdown 块级渲染器 - 表格与段落与块起始判定]

import { renderInline } from '../markdown-inline.js';
import { renderTable, isTableSeparator } from '../table/markdown-table.js';
import type { BlockMatch } from './markdown-block-types.js';

/**
 * Check if line starts a block-level element [检查行是否为块级元素开始]
 * @param line Line to check [待检查行]
 * @returns True if block start [是块级元素则返回 true]
 */
export function isBlockStart(line: string): boolean {
  return /^(#{1,6})\s+/.test(line) ||
         /^[-*]\s+/.test(line) ||
         /^\d+\.\s+/.test(line) ||
         /^>/.test(line) ||
         /^(-{3,}|\*{3,}|_{3,})$/.test(line);
}

/**
 * Render a table at line i, or null [渲染第 i 行起的表格，否则返回 null]
 */
export function renderTableBlock(lines: string[], i: number): BlockMatch | null {
  const trimmed = lines[i].trim();
  if (!(trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1].trim()))) {
    return null;
  }

  const tableLines: string[] = [trimmed];
  let next = i + 1;
  tableLines.push(lines[next].trim()); // separator line [分隔行]
  next++;
  while (next < lines.length && lines[next].trim().includes('|') && lines[next].trim()) {
    tableLines.push(lines[next].trim());
    next++;
  }
  return { html: renderTable(tableLines), next };
}

/**
 * Render a paragraph at line i, or null [渲染第 i 行起的段落，否则返回 null]
 */
export function renderParagraphBlock(lines: string[], i: number): BlockMatch | null {
  const paraLines: string[] = [];
  let next = i;
  while (next < lines.length && lines[next].trim() && !isBlockStart(lines[next].trim())) {
    paraLines.push(lines[next]);
    next++;
  }
  if (paraLines.length === 0) return null;
  return {
    html: `<p>${renderInline(paraLines.join('\n')).replace(/\n/g, '<br>')}</p>`,
    next,
  };
}
