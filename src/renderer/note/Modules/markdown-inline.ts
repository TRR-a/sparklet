// Markdown inline renderer - code, images, links, emphasis [Markdown 行内渲染器 - 代码、图片、链接、强调]

import { escapeHtml } from '../Base/dom-utils.js';

/**
 * Render inline formatting [渲染行内格式]
 * @param text Text to process [待处理文本]
 * @returns HTML string with inline formatting [带行内格式的 HTML 字符串]
 */
export function renderInline(text: string): string {
  let result = escapeHtml(text);

  // Extract inline code first (prevent inner formatting) [先提取行内代码 (防止内部被格式化)]
  const codePlaceholders: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_match: string, code: string) => {
    codePlaceholders.push(code);
    return `\x00CODE${codePlaceholders.length - 1}\x00`;
  });

  // Images (must be before links) [图片 (必须在链接之前)]
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img">');

  // Links [链接]
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Bold [粗体 **text**]
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Strikethrough [删除线 ~~text~~]
  result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Italic [斜体 *text*] - avoid matching ** (bold) [避免匹配 ** (粗体)]
  result = result.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');

  // Restore inline code [恢复行内代码]
  result = result.replace(/\x00CODE(\d+)\x00/g, (_match: string, idx: string) => `<code class="inline-code">${codePlaceholders[parseInt(idx)]}</code>`);

  return result;
}
