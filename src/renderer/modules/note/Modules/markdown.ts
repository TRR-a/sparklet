// Markdown renderer - lightweight markdown-to-HTML conversion [Markdown 渲染器 - 轻量级 markdown 转 HTML]
// Supports: code blocks with language labels, paragraph text with line breaks [支持：带语言标签的代码块、带换行的段落文本]

import { escapeHtml } from '../Base/dom-utils.js';

/**
 * Render markdown text to HTML (supports code blocks and paragraphs) [将 markdown 文本渲染为 HTML (支持代码块和段落)]
 * @param text Markdown source text [Markdown 源文本]
 * @returns Rendered HTML string [渲染后的 HTML 字符串]
 */
export function renderMarkdown(text: string): string {
  if (!text) return '<p style="opacity:0.5;">（空笔记）</p>';

  // Code block regex: ```lang\n...``` [代码块正则：```lang\n...```]
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastEnd = 0;
  const parts: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before code block [代码块前的文本]
    if (match.index > lastEnd) {
      const before = text.slice(lastEnd, match.index).trim();
      if (before) parts.push(`<p>${escapeHtml(before).replace(/\n/g, '<br>')}</p>`);
    }
    // Code block [代码块]
    const lang = match[1] || '';
    const code = match[2] || '';
    const langLabel = lang ? `<span class="code-block-lang">${escapeHtml(lang)}</span>` : '';
    parts.push(`<div class="code-block">${langLabel}<pre style="margin:0;white-space:pre-wrap;word-wrap:break-word;">${escapeHtml(code)}</pre></div>`);
    lastEnd = match.index + match[0].length;
  }

  // Text after last code block [最后一个代码块后的文本]
  if (lastEnd < text.length) {
    const after = text.slice(lastEnd).trim();
    if (after) parts.push(`<p>${escapeHtml(after).replace(/\n/g, '<br>')}</p>`);
  }

  // No parts parsed: fallback to escaped full text [没有解析出任何部分：兜底转义全文]
  if (parts.length === 0) return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
  return parts.join('');
}
