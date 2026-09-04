// HTML/XML highlighter - single-pass tag, attribute, and string tokens [HTML/XML 高亮 - 单遍标签、属性、字符串词元]

import { escapeHtml, span } from './highlight-utils.js';

/** HTML single-pass pattern: comment, tag open, name, attr, string, tag close [HTML 单遍模式] */
const HTML_TOKEN = /<!--[\s\S]*?-->|<\/?[A-Za-z][\w:-]*|"[^"]*"|'[^']*'|[A-Za-z-]+(?==)|\/?>/g;

/**
 * Highlight HTML/XML code [高亮 HTML/XML 代码]
 */
export function highlightHtml(code: string): string {
  let out = '';
  let last = 0;
  let inTag = false;
  HTML_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HTML_TOKEN.exec(code)) !== null) {
    if (m.index > last) out += escapeHtml(code.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('<!--')) {
      out += span('hljs-comment', tok);
    } else if (tok.startsWith('<') || tok === '>' || tok === '/>') {
      inTag = !tok.startsWith('</') && tok !== '>' && tok !== '/>';
      out += span('hljs-keyword', tok);            // bracket + tag name
    } else if (tok.startsWith('"') || tok.startsWith("'")) {
      out += span('hljs-string', tok);
    } else {
      out += inTag ? span('hljs-attr', tok) : escapeHtml(tok);
    }
    last = m.index + tok.length;
  }
  out += escapeHtml(code.slice(last));
  return out;
}
