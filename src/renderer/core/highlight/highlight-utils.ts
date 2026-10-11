// Highlighter shared utilities - HTML escaping and span wrapping [高亮共享工具 - HTML 转义与 span 包裹]
// Emits hljs-* class names so existing theme CSS keeps working [输出 hljs-* 类名，复用已有主题样式]

/** Escape HTML special chars [转义 HTML 特殊字符] */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Wrap escaped text in a span with an hljs class [用 hljs 类的 span 包裹转义文本] */
export function span(cls: string, text: string): string {
  return `<span class="${cls}">${escapeHtml(text)}</span>`;
}
