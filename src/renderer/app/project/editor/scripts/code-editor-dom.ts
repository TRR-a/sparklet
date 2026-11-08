// Code editor: DOM scaffold [代码编辑器 - DOM 骨架]

import type { CodeEditorOptions } from 'sparklet/renderer/app/project/editor/scripts/code-editor-types.js';

/** Created editor DOM nodes [创建的编辑器 DOM 节点] */
export interface CodeEditorNodes {
  root: HTMLElement;
  gutterInner: HTMLElement;
  pre: HTMLElement;
  codeEl: HTMLElement;
  textarea: HTMLTextAreaElement;
}

/**
 * Build the editor DOM scaffold inside the parent element
 * [在父容器内构建编辑器 DOM 骨架]
 */
export function buildCodeEditorDom(parent: HTMLElement, opts: CodeEditorOptions): CodeEditorNodes {
  // Root [根容器]
  const root = document.createElement('div');
  root.className = 'code-editor';

  // Line number gutter [行号槽]
  const gutter = document.createElement('div');
  gutter.className = 'code-editor-gutter';
  const gutterInner = document.createElement('div');
  gutterInner.className = 'code-editor-gutter-inner';
  gutter.appendChild(gutterInner);

  // Scroll area: highlight <pre> under transparent <textarea> [滚动区：高亮层在透明 textarea 之下]
  const scroll = document.createElement('div');
  scroll.className = 'code-editor-scroll';
  const pre = document.createElement('pre');
  pre.className = 'code-editor-highlight';
  const codeEl = document.createElement('code');
  codeEl.className = 'hljs';
  pre.appendChild(codeEl);
  const textarea = document.createElement('textarea');
  textarea.className = 'code-editor-input';
  textarea.value = opts.initialContent;
  textarea.spellcheck = false;
  textarea.wrap = 'off'; // No soft wrap: keeps gutter line numbers aligned [不软换行：保证行号严格对齐]

  scroll.appendChild(pre);
  scroll.appendChild(textarea);
  root.appendChild(gutter);
  root.appendChild(scroll);
  parent.appendChild(root);

  return { root, gutterInner, pre, codeEl, textarea };
}
