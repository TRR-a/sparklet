// Markdown block renderer - headings, lists, quotes, tables, paragraphs [Markdown 块级渲染器 - 标题、列表、引用、表格、段落]

import { renderInline } from './markdown-inline.js';
import { renderTable, isTableSeparator } from './markdown-table.js';

/**
 * Render block-level elements [渲染块级元素]
 * @param text Text to process [待处理文本]
 * @returns HTML string [HTML 字符串]
 */
export function renderBlocks(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines [跳过空行]
    if (!trimmed) { i++; continue; }

    // Heading [标题 # ~ ######]
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      result.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule [分割线 --- *** ___]
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      result.push('<hr>');
      i++;
      continue;
    }

    // Blockquote [引用块 > text]
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      result.push(`<blockquote>${renderInline(quoteLines.join('\n')).replace(/\n/g, '<br>')}</blockquote>`);
      continue;
    }

    // Task list [任务列表 - [x] item]
    const taskMatch = trimmed.match(/^[-*]\s+\[([x ])\]\s+(.+)$/i);
    if (taskMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const tm = lines[i].trim().match(/^[-*]\s+\[([x ])\]\s+(.+)$/i);
        if (!tm) break;
        const isChecked = tm[1].toLowerCase() === 'x';
        items.push(`<li class="task-item${isChecked ? ' checked' : ''}"><span class="task-checkbox">${isChecked ? '\u2611' : '\u2610'}</span> ${renderInline(tm[2])}</li>`);
        i++;
      }
      result.push(`<ul class="task-list">${items.join('')}</ul>`);
      continue;
    }

    // Unordered list [无序列表 - item / * item]
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^[-*]\s+/, '');
        items.push(`<li>${renderInline(item)}</li>`);
        i++;
      }
      result.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list [有序列表 1. item]
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^\d+\.\s+/, '');
        items.push(`<li>${renderInline(item)}</li>`);
        i++;
      }
      result.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Table [表格 | a | b |]
    if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1].trim())) {
      const tableLines: string[] = [trimmed];
      i++;
      tableLines.push(lines[i].trim()); // separator line [分隔行]
      i++;
      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim()) {
        tableLines.push(lines[i].trim());
        i++;
      }
      result.push(renderTable(tableLines));
      continue;
    }

    // Paragraph [段落]
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i].trim())) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      result.push(`<p>${renderInline(paraLines.join('\n')).replace(/\n/g, '<br>')}</p>`);
    }
  }

  return result.join('');
}

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
