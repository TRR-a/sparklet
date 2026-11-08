// Markdown block renderer - headings, lists, quotes, tables, paragraphs [Markdown 块级渲染器 - 标题、列表、引用、表格、段落]
//
// Split out [已拆分]：heading/hr → markdown-block-heading.ts, quote → markdown-block-quote.ts,
// list → markdown-block-list.ts, table/paragraph/detect → markdown-block-table.ts.

import { renderHeadingBlock } from 'sparklet/renderer/shared/markdown/block/markdown-block-heading.js';
import { renderQuoteBlock } from 'sparklet/renderer/shared/markdown/block/markdown-block-quote.js';
import { renderListBlock } from 'sparklet/renderer/shared/markdown/block/markdown-block-list.js';
import { renderTableBlock, renderParagraphBlock } from 'sparklet/renderer/shared/markdown/block/markdown-block-table.js';

export { isBlockStart } from 'sparklet/renderer/shared/markdown/block/markdown-block-table.js';

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
    const trimmed = lines[i].trim();

    // Skip empty lines [跳过空行]
    if (!trimmed) { i++; continue; }

    const block =
      renderHeadingBlock(lines, i) ??
      renderQuoteBlock(lines, i) ??
      renderListBlock(lines, i) ??
      renderTableBlock(lines, i) ??
      renderParagraphBlock(lines, i);

    if (block) {
      result.push(block.html);
      i = block.next;
    }
  }

  return result.join('');
}
