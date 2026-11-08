// C-style highlighter: token scan loop [C 风格高亮 - 词元扫描循环]

import { escapeHtml, span } from '../highlight-utils.js';
import type { CStyleDialect } from './highlight-cstyle-dialects.js';
import { templateSpan } from './highlight-cstyle-template.js';
import { classifyCStyleWord } from './highlight-cstyle-word.js';

/**
 * Scan and highlight tokens in one pass [单遍扫描并高亮]
 * Token order: comment / string / number / word [词元顺序：注释 / 字符串 / 数字 / 单词]
 */
export function scanCStyle(
  code: string,
  dialect: CStyleDialect,
  tokenRe: RegExp,
  wordRe: RegExp
): string {
  let out = '';
  let last = 0;
  let prevWord = '';
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(code)) !== null) {
    if (m.index > last) out += escapeHtml(code.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('/*') || (dialect.lineComment && tok.startsWith(dialect.lineComment))) {
      out += span('hljs-comment', tok);
      prevWord = '';
    } else if (tok.startsWith('"') || tok.startsWith("'") || tok.startsWith('`')) {
      // Template literals carry ${...} interpolations in a distinct color
      // [模板串内 ${...} 插值用独立颜色区分]
      out += tok.startsWith('`') ? templateSpan(tok) : span('hljs-string', tok);
      prevWord = '';
    } else if (/^\d/.test(tok)) {
      out += span('hljs-number', tok);
      prevWord = '';
    } else if (wordRe.test(tok)) {
      // Next non-space char after the word [单词后第一个非空白字符]
      const after = code.slice(m.index + tok.length).match(/^\s*(.)/)?.[1] ?? '';
      const cls = classifyCStyleWord(tok, prevWord, after, dialect);
      out += cls ? span(cls, tok) : escapeHtml(tok);
      prevWord = tok;
    } else {
      out += escapeHtml(tok);
      prevWord = '';
    }
    last = m.index + tok.length;
  }
  out += escapeHtml(code.slice(last));
  return out;
}
