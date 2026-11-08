// C-style highlighter: token regex construction [C 风格高亮 - 词元正则构造]

import type { CStyleDialect } from './highlight-cstyle-dialects.js';

/** Build the one-pass token regex for a dialect [为方言构造单遍词元正则] */
export function buildCStyleTokenRe(dialect: CStyleDialect): RegExp {
  const parts: string[] = [
    String.raw`\/\*[\s\S]*?\*\/`,                                                        // block comment
    dialect.tripleQuotes ? String.raw`"""[\s\S]*?"""|'''[\s\S]*?'''` : '',               // docstring
    dialect.lineComment ? `${dialect.lineComment}[^\n]*` : '',                          // line comment
    dialect.templateString ? '`(?:[^`\\\\]|\\\\.)*`' : '',                              // template literal
    String.raw`"(?:[^"\\\n]|\\.)*"`,                                                     // double-quoted
    String.raw`'(?:[^'\\\n]|\\.)*'`,                                                     // single-quoted
    String.raw`\b\d[\w.]*\b`,                                                            // number
    // CSS: leading '.' starts a class selector word [CSS：'.' 开头为类选择器]
    dialect.cssSelectors ? String.raw`(?:\.[A-Za-z_-]|[A-Za-z_$@#-])[\w$-]*` : String.raw`[A-Za-z_$@#-][\w$-]*`,
  ];
  return new RegExp(parts.filter(Boolean).join('|'), 'g');
}

/** Build the word-start test regex for a dialect [为方言构造单词起始判定正则] */
export function buildCStyleWordRe(dialect: CStyleDialect): RegExp {
  return dialect.cssSelectors ? /^[.#@A-Za-z_$]/ : /^[A-Za-z_$@#]/;
}
