// Custom code editor — textarea + highlight overlay, no third-party dependency
// [自研代码编辑器 — textarea + 高亮层叠加，无第三方依赖]
// Layout: gutter (line numbers) + scroll area where <pre> (highlight) and
// <textarea> (input) overlap perfectly with identical metrics
// [布局：行号槽 + 滚动区，其中 <pre> (高亮) 与 <textarea> (输入) 以相同度量完全重叠]
//
// Split out [已拆分]：types → code-editor-types.ts, DOM → code-editor-dom.ts,
// render/scroll → code-editor-render.ts.

import type { CodeEditorOptions, CodeEditor } from './code-editor-types.js';
import { buildCodeEditorDom } from './code-editor-dom.js';
import { renderEditor, syncEditorScroll } from './code-editor-render.js';

export type { CodeEditorOptions, CodeEditor } from './code-editor-types.js';

/**
 * Create a custom code editor inside a parent element
 * [在父容器内创建自研代码编辑器]
 */
export function createCodeEditor(parent: HTMLElement, opts: CodeEditorOptions): CodeEditor {
  const nodes = buildCodeEditorDom(parent, opts);
  const { root, textarea } = nodes;

  const repaint = (): void => renderEditor(nodes, opts.language);
  repaint();

  textarea.addEventListener('input', () => {
    repaint();
    syncEditorScroll(nodes);
    opts.onChange?.();
  });
  textarea.addEventListener('scroll', () => syncEditorScroll(nodes));
  textarea.addEventListener('keydown', (e: KeyboardEvent) => {
    // Ctrl/Cmd+S saves [Ctrl/Cmd+S 保存]
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      opts.onSave?.();
    }
  });

  return {
    getValue(): string {
      return textarea.value;
    },
    focus(): void {
      textarea.focus();
    },
    destroy(): void {
      root.remove();
    },
  };
}
