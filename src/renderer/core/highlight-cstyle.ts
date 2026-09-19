// C-style highlighter - TS/JS/CSS/Python via dialect config [C 风格高亮 - 通过方言配置支持 TS/JS/CSS/Python]

import { escapeHtml, span } from './highlight-utils.js';

/** C-style language dialect config [C 风格语言方言配置] */
export interface CStyleDialect {
  /** Line comment prefix ('//' for JS, '#' for Python, none for CSS) [行注释前缀] */
  lineComment: string | null;
  /** Template literal backticks enabled (JS only) [模板字符串反引号 (仅 JS)] */
  templateString: boolean;
  /** Triple-quoted strings enabled (Python docstrings) [三引号字符串 (Python 文档串)] */
  tripleQuotes: boolean;
  /** Keyword set [关键字集合] */
  keywords: Set<string>;
  /** Built-in globals / functions → hljs-built_in [内置对象/函数] */
  builtins: Set<string>;
  /** Primitive type names → hljs-type (TS) [基本类型名] */
  types: Set<string>;
  /** Word after these keywords is a definition name → hljs-title [这些关键字后的单词按定义名着色] */
  titleAfter: Set<string>;
  /** '.foo' words are CSS class selectors → hljs-symbol ['.foo' 开头单词按 CSS 类选择器着色] */
  cssSelectors: boolean;
}

const JS_KEYWORDS = new Set('abstract as async await break case catch class const continue debugger declare default delete do else enum export extends finally for from function get if implements import in infer instanceof interface is keyof let namespace never new of package private protected public readonly return satisfies set static super switch this throw try type typeof var void while with yield true false null undefined'.split(' '));

const JS_BUILTINS = new Set('console Math JSON Object Array String Number Boolean Function Promise Map Set WeakMap WeakSet Symbol BigInt Date RegExp Error TypeError RangeError SyntaxError parseInt parseFloat isNaN setTimeout setInterval clearTimeout clearInterval requestAnimationFrame fetch window document navigator location history localStorage sessionStorage globalThis Reflect Proxy structuredClone require module exports process'.split(' '));

const TS_TYPES = new Set('string number boolean any unknown never void object symbol bigint'.split(' '));

const CSS_KEYWORDS = new Set('and important media supports keyframes import from to only screen print not is defined hover focus active visited link root host'.split(' '));

const PY_KEYWORDS = new Set('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None self match case'.split(' '));

const PY_BUILTINS = new Set('print len range str int float bool dict list set tuple frozenset object enumerate zip map filter sorted reversed open input isinstance issubclass super type repr abs min max sum round all any next iter callable format chr ord hex oct bin divmod pow complex bytearray bytes staticmethod classmethod property getattr setattr hasattr'.split(' '));

const JS_TITLE_AFTER = new Set('class interface enum extends implements new'.split(' '));
const PY_TITLE_AFTER = new Set('class'.split(' '));

export const C_STYLE_DIALECTS: Record<string, CStyleDialect> = {
  js: {
    lineComment: '//', templateString: true, tripleQuotes: false,
    keywords: JS_KEYWORDS, builtins: JS_BUILTINS, types: TS_TYPES,
    titleAfter: JS_TITLE_AFTER, cssSelectors: false,
  },
  css: {
    lineComment: null, templateString: false, tripleQuotes: false,
    keywords: CSS_KEYWORDS, builtins: new Set(), types: new Set(),
    titleAfter: new Set(), cssSelectors: true,
  },
  py: {
    lineComment: '#', templateString: false, tripleQuotes: true,
    keywords: PY_KEYWORDS, builtins: PY_BUILTINS, types: new Set(),
    titleAfter: PY_TITLE_AFTER, cssSelectors: false,
  },
};

/** Highlight ${...} interpolations inside a template literal [高亮模板字符串内的 ${...} 插值] */
function templateSpan(tok: string): string {
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

/**
 * Highlight a C-style language in one pass [单遍高亮 C 风格语言]
 * Token order: comment / string / number / word [词元顺序：注释 / 字符串 / 数字 / 单词]
 */
export function highlightCStyle(code: string, dialect: CStyleDialect): string {
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
  const tokenRe = new RegExp(parts.filter(Boolean).join('|'), 'g');
  const wordRe = dialect.cssSelectors ? /^[.#@A-Za-z_$]/ : /^[A-Za-z_$@#]/;

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
      if (tok.startsWith('@')) {
        out += span('hljs-meta', tok);            // decorator / at-rule
      } else if (tok.startsWith('#')) {
        out += span('hljs-symbol', tok);          // CSS id selector
      } else if (dialect.cssSelectors && tok.startsWith('.')) {
        out += span('hljs-symbol', tok);          // CSS class selector
      } else if (dialect.keywords.has(tok)) {
        out += span('hljs-keyword', tok);
      } else if (dialect.builtins.has(tok)) {
        out += span('hljs-built_in', tok);
      } else if (dialect.types.has(tok)) {
        out += span('hljs-type', tok);
      } else if (dialect.titleAfter.has(prevWord)) {
        out += span('hljs-title', tok);           // class / interface / enum name
      } else if (after === '(') {
        out += span('hljs-title', tok);           // function call
      } else if (after === ':') {
        out += span('hljs-attr', tok);            // css property / ts label
      } else {
        out += escapeHtml(tok);
      }
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
