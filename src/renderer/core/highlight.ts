// Custom syntax highlighter — no third-party dependency [自定义语法高亮 — 无第三方依赖]
// Single shared implementation used by both note markdown rendering and the
// project file editor [笔记 Markdown 渲染与项目文件编辑器共用同一实现]
// Emits hljs-* class names so existing theme CSS keeps working [输出 hljs-* 类名，复用已有主题样式]

/** Escape HTML special chars [转义 HTML 特殊字符] */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Wrap escaped text in a span with an hljs class [用 hljs 类的 span 包裹转义文本] */
function span(cls: string, text: string): string {
  return `<span class="${cls}">${escapeHtml(text)}</span>`;
}

// ========== JSON ==========

/** JSON token pattern: strings, numbers, literals [JSON 词元：字符串、数字、字面量] */
const JSON_TOKEN = /"(?:[^"\\\n]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b/g;

function highlightJson(code: string): string {
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

// ========== Markdown ==========

/** Block-level patterns [块级模式] */
const MD_FENCE = /^```/;
const MD_HEADING = /^#{1,6}\s+/;
const MD_HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const MD_QUOTE = /^(\s*>\s?)(.*)$/;
const MD_LIST = /^(\s*)([-*+]|\d+\.)(\s+)/;

/** Inline patterns: code, bold, italic, image, link, bare URL [行内模式：代码、粗体、斜体、图片、链接、裸 URL] */
const MD_INLINE = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|__([^_\n]+)__|\*([^*\n]+)\*|_([^_\n]+)_|!\[([^\]\n]*)\]\(([^)\n]+)\)|\[([^\]\n]*)\]\(([^)\n]+)\)|(https?:\/\/[^\s)]+)/g;

/** Tokenize one inline text segment [标记一段行内文本] */
function highlightInline(text: string): string {
  let out = '';
  let last = 0;
  MD_INLINE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_INLINE.exec(text)) !== null) {
    if (m.index > last) out += escapeHtml(text.slice(last, m.index));
    const [full, code, boldA, boldB, italicA, italicB, imgAlt, imgUrl, linkText, linkUrl, bareUrl] = m;
    if (code !== undefined) out += span('hljs-string', full);
    else if (boldA !== undefined || boldB !== undefined) out += span('hljs-strong', full);
    else if (italicA !== undefined || italicB !== undefined) out += span('hljs-emphasis', full);
    else if (imgUrl !== undefined) out += span('hljs-symbol', `![${imgAlt}]`) + span('hljs-string', `(${imgUrl})`);
    else if (linkUrl !== undefined) out += escapeHtml(`[${linkText}]`) + span('hljs-symbol', `(${linkUrl})`);
    else if (bareUrl !== undefined) out += span('hljs-string', full);
    last = m.index + full.length;
  }
  out += escapeHtml(text.slice(last));
  return out;
}

function highlightMarkdown(code: string): string {
  const lines = code.split('\n');
  const out: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (MD_FENCE.test(line)) {
      inFence = !inFence;
      out.push(span('hljs-meta', line));
      continue;
    }
    // Fenced content stays plain [围栏内容保持纯文本]
    if (inFence) {
      out.push(escapeHtml(line));
      continue;
    }
    if (MD_HEADING.test(line)) {
      out.push(span('hljs-section', line));
      continue;
    }
    if (MD_HR.test(line)) {
      out.push(span('hljs-bullet', line));
      continue;
    }
    const q = line.match(MD_QUOTE);
    if (q) {
      out.push(span('hljs-quote', q[1]) + highlightInline(q[2]));
      continue;
    }
    const l = line.match(MD_LIST);
    if (l) {
      out.push(escapeHtml(l[1]) + span('hljs-bullet', l[2]) + highlightInline(l[3] + line.slice(l[0].length)));
      continue;
    }
    out.push(highlightInline(line));
  }
  return out.join('\n');
}

// ========== C-style languages (TS/JS/CSS/Python...) ==========

/** C-style language dialect config [C 风格语言方言配置] */
interface CStyleDialect {
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

const C_STYLE_DIALECTS: Record<string, CStyleDialect> = {
  js: { lineComment: '//', templateString: true, keywords: JS_KEYWORDS },
  css: { lineComment: null, templateString: false, keywords: CSS_KEYWORDS },
  py: { lineComment: '#', templateString: false, keywords: PY_KEYWORDS },
};

/**
 * Highlight a C-style language in one pass [单遍高亮 C 风格语言]
 * Token order: comment / string / number / word [词元顺序：注释 / 字符串 / 数字 / 单词]
 */
function highlightCStyle(code: string, dialect: CStyleDialect): string {
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

// ========== HTML / XML ==========

/** HTML single-pass pattern: comment, tag open, name, attr, string, tag close [HTML 单遍模式] */
const HTML_TOKEN = /<!--[\s\S]*?-->|<\/?[A-Za-z][\w:-]*|"[^"]*"|'[^']*'|[A-Za-z-]+(?==)|\/?>/g;

function highlightHtml(code: string): string {
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

// ========== Public API [公开接口] ==========

/** Language resolver per file extension [按扩展名解析语言] */
const EXT_LANG: Record<string, string> = {
  ts: 'ts', tsx: 'ts', mts: 'ts', cts: 'ts',
  js: 'js', jsx: 'js', mjs: 'js', cjs: 'js',
  css: 'css', scss: 'css', less: 'css',
  html: 'html', htm: 'html', svg: 'html', xml: 'html',
  json: 'json', jsonc: 'json',
  md: 'md', markdown: 'md',
  py: 'py', pyw: 'py',
};

/**
 * Map a file name to a supported language id ('' if unsupported)
 * [将文件名映射到受支持的语言 ID (不支持返回 '')]
 */
export function getLanguageForFile(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return EXT_LANG[ext] ?? '';
}

/**
 * Highlight code in the given language [按语言高亮代码]
 * Unknown languages return escaped plain text [未知语言返回转义纯文本]
 */
export function highlightCode(code: string, lang: string): string {
  switch (lang) {
    case 'json': return highlightJson(code);
    case 'md': return highlightMarkdown(code);
    case 'html': return highlightHtml(code);
    case 'ts': return highlightCStyle(code, C_STYLE_DIALECTS.js);
    case 'js': return highlightCStyle(code, C_STYLE_DIALECTS.js);
    case 'css': return highlightCStyle(code, C_STYLE_DIALECTS.css);
    case 'py': return highlightCStyle(code, C_STYLE_DIALECTS.py);
    default: return escapeHtml(code);
  }
}
