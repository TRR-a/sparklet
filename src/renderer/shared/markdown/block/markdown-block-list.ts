// Markdown block renderer: task / unordered / ordered lists [Markdown 块级渲染器 - 任务/无序/有序列表]

import { renderInline } from 'sparklet/renderer/shared/markdown/markdown-inline.js';
import type { BlockMatch } from 'sparklet/renderer/shared/markdown/block/markdown-block-types.js';

/**
 * Render a task list, unordered list or ordered list at line i, or null
 * [渲染第 i 行起的任务列表、无序列表或有序列表，否则返回 null]
 */
export function renderListBlock(lines: string[], i: number): BlockMatch | null {
  const trimmed = lines[i].trim();

  // Task list [任务列表 - [x] item]
  const taskMatch = trimmed.match(/^[-*]\s+\[([x ])\]\s+(.+)$/i);
  if (taskMatch) {
    const items: string[] = [];
    let next = i;
    while (next < lines.length) {
      const tm = lines[next].trim().match(/^[-*]\s+\[([x ])\]\s+(.+)$/i);
      if (!tm) break;
      const isChecked = tm[1].toLowerCase() === 'x';
      items.push(`<li class="task-item${isChecked ? ' checked' : ''}"><span class="task-checkbox">${isChecked ? '\u2611' : '\u2610'}</span> ${renderInline(tm[2])}</li>`);
      next++;
    }
    return { html: `<ul class="task-list">${items.join('')}</ul>`, next };
  }

  // Unordered list [无序列表 - item / * item]
  if (/^[-*]\s+/.test(trimmed)) {
    const items: string[] = [];
    let next = i;
    while (next < lines.length && /^[-*]\s+/.test(lines[next].trim())) {
      const item = lines[next].trim().replace(/^[-*]\s+/, '');
      items.push(`<li>${renderInline(item)}</li>`);
      next++;
    }
    return { html: `<ul>${items.join('')}</ul>`, next };
  }

  // Ordered list [有序列表 1. item]
  if (/^\d+\.\s+/.test(trimmed)) {
    const items: string[] = [];
    let next = i;
    while (next < lines.length && /^\d+\.\s+/.test(lines[next].trim())) {
      const item = lines[next].trim().replace(/^\d+\.\s+/, '');
      items.push(`<li>${renderInline(item)}</li>`);
      next++;
    }
    return { html: `<ol>${items.join('')}</ol>`, next };
  }

  return null;
}
