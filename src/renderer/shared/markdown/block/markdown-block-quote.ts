// Markdown block renderer: blockquote [Markdown 块级渲染器 - 引用块]

import { renderInline } from 'sparklet/renderer/shared/markdown/markdown-inline.js';
import type { BlockMatch } from 'sparklet/renderer/shared/markdown/block/markdown-block-types.js';

/**
 * Render a blockquote at line i, or null [渲染第 i 行起的引用块，否则返回 null]
 */
export function renderQuoteBlock(lines: string[], i: number): BlockMatch | null {
  if (!lines[i].trim().startsWith('>')) return null;

  const quoteLines: string[] = [];
  let next = i;
  while (next < lines.length && lines[next].trim().startsWith('>')) {
    quoteLines.push(lines[next].trim().replace(/^>\s?/, ''));
    next++;
  }
  return {
    html: `<blockquote>${renderInline(quoteLines.join('\n')).replace(/\n/g, '<br>')}</blockquote>`,
    next,
  };
}
