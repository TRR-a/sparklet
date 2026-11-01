// Markdown highlighter - block patterns and inline tokens [Markdown 高亮 - 块级模式与行内词元]

import { escapeHtml, span } from './highlight-utils.js';
// Circular with highlight.ts on purpose: fences delegate their inner language
// back to the router. ESM live bindings make this safe.
// [与 highlight.ts 有意循环引用：围栏内容委托回路由入口；ESM 活绑定保证安全]
import { highlightCode } from './highlight.js';

/** Block-level patterns [块级模式] */
const MD_FENCE = /^```\s*(\w*)/;
const MD_HEADING = /^#{1,6}\s+/;
const MD_HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const MD_SETEXT = /^\s*={3,}\s*$/;
const MD_QUOTE = /^(\s*>\s?)(.*)$/;
const MD_LIST = /^(\s*)([-*+]|\d+\.)(\s+)/;
/** Table separator row: only pipe/colon/dash/space with a --- run [表格分隔行：仅含 | : - 空格] */
const MD_TABLE_SEP = /^[|:\-\s]+$/;

/** Inline patterns: code, bold, italic, strikethrough, image, link, bare URL [行内模式：代码、粗体、斜体、删除线、图片、链接、裸 URL] */
const MD_INLINE = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|__([^_\n]+)__|\*([^*\n]+)\*|_([^_\n]+)_|~~([^~\n]+)~~|!\[([^\]\n]*)\]\(([^)\n]+)\)|\[([^\]\n]*)\]\(([^)\n]+)\)|(https?:\/\/[^\s)]+)/g;

/** Tokenize one inline text segment [标记一段行内文本] */
function highlightInline(text: string): string {
  let out = '';
  let last = 0;
  MD_INLINE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_INLINE.exec(text)) !== null) {
    if (m.index > last) out += escapeHtml(text.slice(last, m.index));
    const [full, code, boldA, boldB, italicA, italicB, strike, imgAlt, imgUrl, linkText, linkUrl, bareUrl] = m;
    if (code !== undefined) out += span('hljs-string', full);
    else if (boldA !== undefined || boldB !== undefined) out += span('hljs-strong', full);
    else if (italicA !== undefined || italicB !== undefined) out += span('hljs-emphasis', full);
    else if (strike !== undefined) out += span('hljs-deletion', full);
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
  let fenceLang = '';
  let fenceBuf: string[] | null = null;
  for (const line of lines) {
    // Inside a fence: buffer content, delegate to the inner language highlighter
    // [围栏内：缓存内容，结束时委托给内层语言高亮]
    if (fenceBuf !== null) {
      if (/^```/.test(line)) {
        out.push(highlightCode(fenceBuf.join('\n'), fenceLang));
        out.push(span('hljs-meta', line));
        fenceBuf = null;
      } else {
        fenceBuf.push(line);
      }
      continue;
    }
    if (MD_FENCE.test(line)) {
      fenceLang = (line.match(MD_FENCE)![1] || '').toLowerCase();
      fenceBuf = [];
      out.push(span('hljs-meta', line));
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
    // Setext heading underline [Setext 标题下划线]
    if (MD_SETEXT.test(line)) {
      out.push(span('hljs-section', line));
      continue;
    }
    const t = line.trim();
    if (MD_TABLE_SEP.test(t) && t.includes('---') && t.includes('|')) {
      out.push(span('hljs-meta', line));
      continue;
    }
    const q = line.match(MD_QUOTE);
    if (q) {
      out.push(span('hljs-quote', q[1]) + highlightInline(q[2]));
      continue;
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
        out.push(indent + bullet + gap + span('hljs-symbol', `[${task[1]}]`) + highlightInline(rem.slice(task[0].length)));
      } else {
        out.push(indent + bullet + gap + highlightInline(rem));
      }
      continue;
    }
    out.push(highlightInline(line));
  }
  // Unterminated fence at EOF still highlights what was collected
  // [文件结束时未闭合的围栏也高亮已收集内容]
  if (fenceBuf !== null) out.push(highlightCode(fenceBuf.join('\n'), fenceLang));
  return out.join('\n');
}
