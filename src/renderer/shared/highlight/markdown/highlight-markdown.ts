// Markdown highlighter - block patterns and inline tokens [Markdown 高亮 - 块级模式与行内词元]
//
// Split out [已拆分]：patterns → highlight-markdown-patterns.ts,
// inline → highlight-markdown-inline.ts, single-line blocks → highlight-markdown-block.ts.

import { span } from 'sparklet/renderer/shared/highlight/highlight-utils.js';
// Circular with highlight.ts on purpose: fences delegate their inner language
// back to the router. ESM live bindings make this safe.
// [与 highlight.ts 有意循环引用：围栏内容委托回路由入口；ESM 活绑定保证安全]
import { highlightCode } from 'sparklet/renderer/shared/highlight/highlight.js';
import { MD_FENCE } from 'sparklet/renderer/shared/highlight/markdown/highlight-markdown-patterns.js';
import { highlightInline } from 'sparklet/renderer/shared/highlight/markdown/highlight-markdown-inline.js';
import { highlightMarkdownLine } from 'sparklet/renderer/shared/highlight/markdown/highlight-markdown-block.js';

/**
 * Highlight Markdown code [高亮 Markdown 代码]
 */
export function highlightMarkdown(code: string): string {
  const lines = code.split('\n');
  const out: string[] = [];
  let fenceLang = '';
  let fenceBuf: string[] | null = null;
  for (const line of lines) {
    // Inside a fence: buffer content, delegate to the inner language highlighter
    // [围栏内：缓存内容，结束时委托给内层语言高亮]
    if (fenceBuf !== null) {
      if (/^```/.test(line)) {
        out.push(highlightCode(fenceBuf.join('\n'), fenceLang));
        out.push(span('hljs-meta', line));
        fenceBuf = null;
      } else {
        fenceBuf.push(line);
      }
      continue;
    }
    if (MD_FENCE.test(line)) {
      fenceLang = (line.match(MD_FENCE)![1] || '').toLowerCase();
      fenceBuf = [];
      out.push(span('hljs-meta', line));
      continue;
    }
    const rendered = highlightMarkdownLine(line);
    out.push(rendered !== null ? rendered : highlightInline(line));
  }
  // Unterminated fence at EOF still highlights what was collected
  // [文件结束时未闭合的围栏也高亮已收集内容]
  if (fenceBuf !== null) out.push(highlightCode(fenceBuf.join('\n'), fenceLang));
  return out.join('\n');
}
