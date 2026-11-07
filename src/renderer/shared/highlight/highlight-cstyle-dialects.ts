// C-style highlighter: dialect config and keyword tables [C 风格高亮 - 方言配置与关键字表]

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
