// C-style highlighter - TS/JS/CSS/Python via dialect config [C 风格高亮 - 通过方言配置支持 TS/JS/CSS/Python]

import { escapeHtml, span } from './highlight-utils.js';

/** C-style language dialect config [C 风格语言方言配置] */
export interface CStyleDialect {
  /** Line comment prefix ('//' for JS, '#' for Python, none for CSS) [行注释前缀] */
  lineComment: string | null;
  /** Template literal backticks enabled (JS only) [模板字符串反引号 (仅 JS)] */
  templateString: boolean;
  /** Keyword set [关键字集合] */
  keywords: Set<string>;
}

const JS_KEYWORDS = new Set('abstract as async await break case catch class const continue debugger declare default delete do else enum export extends finally for from function get if implements import in infer instanceof interface is keyof let namespace never new of package private protected public readonly return satisfies set static super switch this throw try type typeof var void while with yield true false null undefined'.split(' '));

const CSS_KEYWORDS = new Set('and important media supports keyframes import from to only screen print not is defined hover focus active visited link root host'.split(' '));

const PY_KEYWORDS = new Set('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None self match case'.split(' '));

export const C_STYLE_DIALECTS: Record<string, CStyleDialect> = {
  js: { lineComment: '//', templateString: true, keywords: JS_KEYWORDS },
  css: { lineComment: null, templateString: false, keywords: CSS_KEYWORDS },
  py: { lineComment: '#', templateString: false, keywords: PY_KEYWORDS },
};

/**
 * Highlight a C-style language in one pass [单遍高亮 C 风格语言]
 * Token order: comment / string / number / word [词元顺序：注释 / 字符串 / 数字 / 单词]
 */
export function highlightCStyle(code: string, dialect: CStyleDialect): string {
  const parts: string[] = [
    String.raw`\/\*[\s\S]*?\*\/`,                                                        // block comment
    dialect.lineComment ? `${dialect.lineComment}[^\n]*` : '',                          // line comment
    dialect.templateString ? '`(?:[^`\\\\]|\\\\.)*`' : '',                              // template literal
    String.raw`"(?:[^"\\\n]|\\.)*"`,                                                     // double-quoted
    String.raw`'(?:[^'\\\n]|\\.)*'`,                                                     // single-quoted
    String.raw`\b\d[\w.]*\b`,                                                            // number
    String.raw`[A-Za-z_$@#-][\w$-]*`,                                                    // word / decorator / css-id
  ];
  const tokenRe = new RegExp(parts.filter(Boolean).join('|'), 'g');
  const wordRe = /^[A-Za-z_$@#-]/;

  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(code)) !== null) {
    if (m.index > last) out += escapeHtml(code.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('/*') || (dialect.lineComment && tok.startsWith(dialect.lineComment))) {
      out += span('hljs-comment', tok);
    } else if (tok.startsWith('"') || tok.startsWith("'") || tok.startsWith('`')) {
      out += span('hljs-string', tok);
    } else if (/^\d/.test(tok)) {
      out += span('hljs-number', tok);
    } else if (wordRe.test(tok)) {
      // Next non-space char after the word [单词后第一个非空白字符]
      const after = code.slice(m.index + tok.length).match(/^\s*(.)/)?.[1] ?? '';
      if (tok.startsWith('@')) {
        out += span('hljs-meta', tok);            // decorator / at-rule
      } else if (tok.startsWith('#')) {
        out += span('hljs-symbol', tok);          // CSS id selector
      } else if (dialect.keywords.has(tok)) {
        out += span('hljs-keyword', tok);
      } else if (after === '(') {
        out += span('hljs-title', tok);           // function call
      } else if (after === ':') {
        out += span('hljs-attr', tok);            // css property / ts label
      } else {
        out += escapeHtml(tok);
      }
    } else {
      out += escapeHtml(tok);
    }
    last = m.index + tok.length;
  }
  out += escapeHtml(code.slice(last));
  return out;
}
