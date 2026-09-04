// Markdown highlighter - block patterns and inline tokens [Markdown 高亮 - 块级模式与行内词元]

import { escapeHtml, span } from './highlight-utils.js';

/** Block-level patterns [块级模式] */
const MD_FENCE = /^```/;
const MD_HEADING = /^#{1,6}\s+/;
const MD_HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const MD_QUOTE = /^(\s*>\s?)(.*)$/;
const MD_LIST = /^(\s*)([-*+]|\d+\.)(\s+)/;

/** Inline patterns: code, bold, italic, image, link, bare URL [行内模式：代码、粗体、斜体、图片、链接、裸 URL] */
const MD_INLINE = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|__([^_\n]+)__|\*([^*\n]+)\*|_([^_\n]+)_|!\[([^\]\n]*)\]\(([^)\n]+)\)|\[([^\]\n]*)\]\(([^)\n]+)\)|(https?:\/\/[^\s)]+)/g;

/** Tokenize one inline text segment [标记一段行内文本] */
function highlightInline(text: string): string {
  let out = '';
  let last = 0;
  MD_INLINE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_INLINE.exec(text)) !== null) {
    if (m.index > last) out += escapeHtml(text.slice(last, m.index));
    const [full, code, boldA, boldB, italicA, italicB, imgAlt, imgUrl, linkText, linkUrl, bareUrl] = m;
    if (code !== undefined) out += span('hljs-string', full);
    else if (boldA !== undefined || boldB !== undefined) out += span('hljs-strong', full);
    else if (italicA !== undefined || italicB !== undefined) out += span('hljs-emphasis', full);
    else if (imgUrl !== undefined) out += span('hljs-symbol', `![${imgAlt}]`) + span('hljs-string', `(${imgUrl})`);
    else if (linkUrl !== undefined) out += escapeHtml(`[${linkText}]`) + span('hljs-symbol', `(${linkUrl})`);
    else if (bareUrl !== undefined) out += span('hljs-string', full);
    last = m.index + full.length;
  }
  out += escapeHtml(text.slice(last));
  return out;
}

/**
 * Highlight Markdown code [高亮 Markdown 代码]
 */
export function highlightMarkdown(code: string): string {
  const lines = code.split('\n');
  const out: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (MD_FENCE.test(line)) {
      inFence = !inFence;
      out.push(span('hljs-meta', line));
      continue;
    }
    // Fenced content stays plain [围栏内容保持纯文本]
    if (inFence) {
      out.push(escapeHtml(line));
      continue;
    }
    if (MD_HEADING.test(line)) {
      out.push(span('hljs-section', line));
      continue;
    }
    if (MD_HR.test(line)) {
      out.push(span('hljs-bullet', line));
      continue;
    }
    const q = line.match(MD_QUOTE);
    if (q) {
      out.push(span('hljs-quote', q[1]) + highlightInline(q[2]));
      continue;
    }
    const l = line.match(MD_LIST);
    if (l) {
      out.push(escapeHtml(l[1]) + span('hljs-bullet', l[2]) + highlightInline(l[3] + line.slice(l[0].length)));
      continue;
    }
    out.push(highlightInline(line));
  }
  return out.join('\n');
}
