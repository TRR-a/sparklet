// Custom syntax highlighter for JSON and Markdown code blocks
// [JSON 与 Markdown 代码块的自定义语法高亮]
// Emits hljs-* class names so existing theme CSS in editor.css keeps working
// [输出 hljs-* 类名，复用 editor.css 中已有的三套主题样式]
// No third-party dependency [无第三方依赖]

import { escapeHtml } from '../Base/dom-utils.js';

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
const FENCE = /^```/;
const HEADING = /^#{1,6}\s+/;
const HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const QUOTE = /^(\s*>\s?)(.*)$/;
const LIST = /^(\s*)([-*+]|\d+\.)(\s+)/;

/** Inline patterns: code, bold, italic, image, link, bare URL [行内模式：代码、粗体、斜体、图片、链接、裸 URL] */
const INLINE = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|__([^_\n]+)__|\*([^*\n]+)\*|_([^_\n]+)_|!\[([^\]\n]*)\]\(([^)\n]+)\)|\[([^\]\n]*)\]\(([^)\n]+)\)|(https?:\/\/[^\s)]+)/g;

/** Tokenize one inline text segment [标记一段行内文本] */
function highlightInline(text: string): string {
  let out = '';
  let last = 0;
  INLINE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE.exec(text)) !== null) {
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
    if (FENCE.test(line)) {
      inFence = !inFence;
      out.push(span('hljs-meta', line));
      continue;
    }
    // Fenced content stays plain [围栏内容保持纯文本]
    if (inFence) {
      out.push(escapeHtml(line));
      continue;
    }
    if (HEADING.test(line)) {
      out.push(span('hljs-section', line));
      continue;
    }
    if (HR.test(line)) {
      out.push(span('hljs-bullet', line));
      continue;
    }
    const q = line.match(QUOTE);
    if (q) {
      out.push(span('hljs-quote', q[1]) + highlightInline(q[2]));
      continue;
    }
    const l = line.match(LIST);
    if (l) {
      out.push(escapeHtml(l[1]) + span('hljs-bullet', l[2]) + highlightInline(l[3] + line.slice(l[0].length)));
      continue;
    }
    out.push(highlightInline(line));
  }
  return out.join('\n');
}

// ========== Public API [公开接口] ==========

const LANG_MAP: Record<string, (code: string) => string> = {
  json: highlightJson,
  md: highlightMarkdown,
  markdown: highlightMarkdown,
};

/** Check whether a language is supported by the custom highlighter [检查自定义高亮器是否支持该语言] */
export function isLanguageSupported(lang: string): boolean {
  return lang.toLowerCase() in LANG_MAP;
}

/**
 * Highlight code with the built-in JSON/Markdown highlighter
 * [用内置 JSON/Markdown 高亮器高亮代码]
 * Unsupported languages return escaped plain text [不支持的语言返回转义后的纯文本]
 */
export function highlightCode(code: string, lang: string): string {
  const fn = LANG_MAP[lang.toLowerCase()];
  return fn ? fn(code) : escapeHtml(code);
}
