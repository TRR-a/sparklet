// Markdown highlighter: single-line block rendering [Markdown 高亮 - 单行块级渲染]

import { escapeHtml, span } from './highlight-utils.js';
import { highlightInline } from './highlight-markdown-inline.js';
import {
  MD_HEADING, MD_HR, MD_SETEXT, MD_TABLE_SEP, MD_QUOTE, MD_LIST,
} from './highlight-markdown-patterns.js';

/**
 * Highlight one non-fence line, or null when it is plain text [高亮一行非围栏文本，普通文本返回 null]
 */
export function highlightMarkdownLine(line: string): string | null {
  if (MD_HEADING.test(line)) {
    return span('hljs-section', line);
  }
  if (MD_HR.test(line)) {
    return span('hljs-bullet', line);
  }
  // Setext heading underline [Setext 标题下划线]
  if (MD_SETEXT.test(line)) {
    return span('hljs-section', line);
  }
  const t = line.trim();
  if (MD_TABLE_SEP.test(t) && t.includes('---') && t.includes('|')) {
    return span('hljs-meta', line);
  }
  const q = line.match(MD_QUOTE);
  if (q) {
    return span('hljs-quote', q[1]) + highlightInline(q[2]);
  }
  const l = line.match(MD_LIST);
  if (l) {
    const indent = escapeHtml(l[1]);
    const bullet = span('hljs-bullet', l[2]);
    const gap = escapeHtml(l[3]);
    const rem = line.slice(l[0].length);
    // Task list checkbox [任务列表勾选框]
    const task = rem.match(/^\[([ xX])\]\s?/);
    if (task) {
      return indent + bullet + gap + span('hljs-symbol', `[${task[1]}]`) + highlightInline(rem.slice(task[0].length));
    }
    return indent + bullet + gap + highlightInline(rem);
  }
  return null;
}
