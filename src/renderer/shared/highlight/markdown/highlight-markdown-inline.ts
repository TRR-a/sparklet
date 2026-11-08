// Markdown highlighter: inline tokens [Markdown 高亮 - 行内词元]

import { escapeHtml, span } from 'sparklet/renderer/shared/highlight/highlight-utils.js';
import { MD_INLINE } from 'sparklet/renderer/shared/highlight/markdown/highlight-markdown-patterns.js';

/** Tokenize one inline text segment [标记一段行内文本] */
export function highlightInline(text: string): string {
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
