// Custom syntax highlighter entry - language resolution and dispatch [自定义语法高亮入口 - 语言解析与分发]
// No third-party dependency; language implementations in highlight-*.ts [无第三方依赖；各语言实现在 highlight-*.ts]
// Emits hljs-* class names so existing theme CSS keeps working [输出 hljs-* 类名，复用已有主题样式]

import { escapeHtml } from './highlight-utils.js';
import { highlightJson } from './highlight-json.js';
import { highlightMarkdown } from './highlight-markdown.js';
import { highlightCStyle, C_STYLE_DIALECTS } from './highlight-cstyle.js';
import { highlightHtml } from './highlight-html.js';

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
