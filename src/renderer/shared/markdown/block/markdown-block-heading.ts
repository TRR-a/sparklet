// Markdown block renderer: headings + horizontal rules [Markdown 块级渲染器 - 标题与分割线]

import { renderInline } from 'sparklet/renderer/shared/markdown/markdown-inline.js';
import type { BlockMatch } from 'sparklet/renderer/shared/markdown/block/markdown-block-types.js';

/**
 * Render a heading or horizontal rule at line i, or null [渲染第 i 行的标题或分割线，否则返回 null]
 */
export function renderHeadingBlock(lines: string[], i: number): BlockMatch | null {
  const trimmed = lines[i].trim();

  // Heading [标题 # ~ ######]
  const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    return { html: `<h${level}>${renderInline(headingMatch[2])}</h${level}>`, next: i + 1 };
  }

  // Horizontal rule [分割线 --- *** ___]
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
    return { html: '<hr>', next: i + 1 };
  }

  return null;
}
