// Markdown renderer - lightweight markdown-to-HTML conversion [Markdown 渲染器 - 轻量级 markdown 转 HTML]
// Main entry point; block/inline/table renderers moved to markdown-renderers.ts [主入口；块级/行内/表格渲染器已移至 markdown-renderers.ts]

import { escapeHtml } from '../Base/dom-utils.js';
import { renderBlocks } from './markdown-renderers.js';
import { highlightCode } from './highlight.js';

/**
 * Render markdown text to HTML [将 markdown 文本渲染为 HTML]
 * @param text Markdown source text [Markdown 源文本]
 * @returns Rendered HTML string [渲染后的 HTML 字符串]
 */
export function renderMarkdown(text: string): string {
  if (!text) return '<p style="opacity:0.5;">（空笔记）</p>';

  // 1. Extract code blocks first [先提取代码块]
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastEnd = 0;
  const parts: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Process text before code block [处理代码块前的文本]
    if (match.index > lastEnd) {
      parts.push(renderBlocks(text.slice(lastEnd, match.index)));
    }
    // Code block with syntax highlighting [带语法高亮的代码块]
    const lang = (match[1] || '').toLowerCase();
    const code = match[2] || '';
    const langLabel = lang ? `<span class="code-block-lang">${escapeHtml(lang)}</span>` : '';
    let highlighted: string;
    try {
      // Custom highlighter: JSON/Markdown colored, others plain [自研高亮：JSON/Markdown 着色，其余纯文本]
      highlighted = highlightCode(code, lang);
    } catch {
      highlighted = escapeHtml(code);
    }
    parts.push(`<div class="code-block">${langLabel}<pre><code class="hljs${lang ? ' language-' + escapeHtml(lang) : ''}">${highlighted}</code></pre></div>`);
    lastEnd = match.index + match[0].length;
  }

  // Text after last code block [最后一个代码块后的文本]
  if (lastEnd < text.length) {
    parts.push(renderBlocks(text.slice(lastEnd)));
  }

  if (parts.length === 0) return `<div class="markdown-body"><p>${escapeHtml(text).replace(/\n/g, '<br>')}</p></div>`;
  return `<div class="markdown-body">${parts.join('')}</div>`;
}
