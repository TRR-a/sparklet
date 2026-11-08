// Code editor: highlight + gutter rendering, scroll sync [代码编辑器 - 高亮与行号渲染、滚动同步]

import { highlightCode } from 'sparklet/renderer/shared/highlight/highlight.js';
import type { CodeEditorNodes } from 'sparklet/renderer/app/project/editor/scripts/code-editor-dom.js';

/** Render highlight + line numbers for current value [按当前值渲染高亮与行号] */
export function renderEditor(nodes: CodeEditorNodes, language: string): void {
  const { codeEl, gutterInner, textarea } = nodes;
  const value = textarea.value;
  codeEl.innerHTML = highlightCode(value, language);
  // Trailing newline placeholder so the last line stays visible [末尾换行占位，保证最后一行可见]
  if (value.endsWith('\n')) codeEl.innerHTML += '\n ';
  const lineCount = value.split('\n').length;
  const nums: string[] = [];
  for (let i = 1; i <= lineCount; i++) nums.push(`<span>${i}</span>`);
  gutterInner.innerHTML = nums.join('');
}

/** Sync overlay scroll positions [同步高亮层滚动位置] */
export function syncEditorScroll(nodes: CodeEditorNodes): void {
  const { pre, gutterInner, textarea } = nodes;
  pre.scrollTop = textarea.scrollTop;
  pre.scrollLeft = textarea.scrollLeft;
  gutterInner.style.transform = `translateY(${-textarea.scrollTop}px)`;
}
