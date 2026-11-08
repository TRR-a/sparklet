// C-style highlighter: template literal interpolation [C 风格高亮 - 模板字符串插值]

import { span } from '../highlight-utils.js';

/** Highlight ${...} interpolations inside a template literal [高亮模板字符串内的 ${...} 插值] */
export function templateSpan(tok: string): string {
  let out = '';
  let last = 0;
  const re = /\$\{[^}]*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tok)) !== null) {
    if (m.index > last) out += span('hljs-string', tok.slice(last, m.index));
    out += span('hljs-template-variable', m[0]);
    last = m.index + m[0].length;
  }
  out += span('hljs-string', tok.slice(last));
  return out;
}
