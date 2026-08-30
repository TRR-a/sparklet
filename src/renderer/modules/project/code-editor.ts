// Custom code editor — textarea + highlight overlay, no third-party dependency
// [自研代码编辑器 — textarea + 高亮层叠加，无第三方依赖]
// Layout: gutter (line numbers) + scroll area where <pre> (highlight) and
// <textarea> (input) overlap perfectly with identical metrics
// [布局：行号槽 + 滚动区，其中 <pre> (高亮) 与 <textarea> (输入) 以相同度量完全重叠]

import { highlightCode } from '../../core/highlight.js';

/** Editor creation options [编辑器创建选项] */
export interface CodeEditorOptions {
  initialContent: string;
  /** Language id from getLanguageForFile, '' = plain [语言 ID，空串为纯文本] */
  language: string;
  /** Content-change notification (dirty) [内容变更通知 (脏状态)] */
  onChange?: () => void;
  /** Save shortcut notification (Ctrl/Cmd+S) [保存快捷键通知] */
  onSave?: () => void;
}

/** Editor instance handle [编辑器实例句柄] */
export interface CodeEditor {
  getValue(): string;
  focus(): void;
  destroy(): void;
}

/**
 * Create a custom code editor inside a parent element
 * [在父容器内创建自研代码编辑器]
 */
export function createCodeEditor(parent: HTMLElement, opts: CodeEditorOptions): CodeEditor {
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

  /** Render highlight + line numbers for current value [按当前值渲染高亮与行号] */
  function render(): void {
    const value = textarea.value;
    codeEl.innerHTML = highlightCode(value, opts.language);
    // Trailing newline placeholder so the last line stays visible [末尾换行占位，保证最后一行可见]
    if (value.endsWith('\n')) codeEl.innerHTML += '\n ';
    const lineCount = value.split('\n').length;
    const nums: string[] = [];
    for (let i = 1; i <= lineCount; i++) nums.push(`<span>${i}</span>`);
    gutterInner.innerHTML = nums.join('');
  }

  /** Sync overlay scroll positions [同步高亮层滚动位置] */
  function syncScroll(): void {
    pre.scrollTop = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
    gutterInner.style.transform = `translateY(${-textarea.scrollTop}px)`;
  }

  render();

  textarea.addEventListener('input', () => {
    render();
    syncScroll();
    opts.onChange?.();
  });
  textarea.addEventListener('scroll', syncScroll);
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
