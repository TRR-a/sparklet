// Project file preview - entry barrel [项目文件预览 - 入口]
// Uses the built-in textarea + overlay editor, no third-party dependency
// [使用内置 textarea + 高亮层编辑器，无第三方依赖]
//
// Split out [已拆分]：state → project-preview-state.ts, panel → project-preview-panel.ts,
// render → project-preview-render.ts, save → project-preview-save.ts.

import { getEditor, setEditor, setEditTarget, setIsDirty } from './project-preview-state.js';
import { showFilePreviewPanel } from './project-preview-panel.js';

export { previewFile } from './project-preview-render.js';
export { saveCurrentFile } from './project-preview-save.js';

/**
 * Close file preview and restore note editor [关闭文件预览并恢复笔记编辑器]
 */
export function closeFilePreview(): void {
  const editor = getEditor();
  if (editor) {
    editor.destroy();
    setEditor(null);
  }
  setEditTarget(null, null);
  setIsDirty(false);
  const nameEl = document.getElementById('filePreviewName');
  nameEl?.classList.remove('dirty');
  showFilePreviewPanel(false);
}
