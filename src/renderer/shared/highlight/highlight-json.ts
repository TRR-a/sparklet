// JSON highlighter - strings (key/value aware), numbers, literals [JSON 高亮 - 字符串 (区分键值)、数字、字面量]

import { escapeHtml, span } from './highlight-utils.js';

/** JSON token pattern: strings, numbers, literals [JSON 词元：字符串、数字、字面量] */
const JSON_TOKEN = /"(?:[^"\\\n]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b/g;

/**
 * Highlight JSON code [高亮 JSON 代码]
 */
export function highlightJson(code: string): string {
  let out = '';
  let last = 0;
  JSON_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = JSON_TOKEN.exec(code)) !== null) {
    if (m.index > last) out += escapeHtml(code.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('"')) {
      // Key if the next non-space char is ':' [其后第一个非空白字符为 ':' 则是键]
      const isKey = /^\s*:/.test(code.slice(m.index + tok.length));
      out += span(isKey ? 'hljs-attr' : 'hljs-string', tok);
    } else if (tok === 'true' || tok === 'false' || tok === 'null') {
      out += span('hljs-literal', tok);
    } else {
      out += span('hljs-number', tok);
    }
    last = m.index + tok.length;
  }
  out += escapeHtml(code.slice(last));
  return out;
}
