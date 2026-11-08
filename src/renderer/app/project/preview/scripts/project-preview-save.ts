// Project preview: save current file [项目预览 - 保存当前文件]

import { projectApi } from '../../api/scripts/project-api.js';
import { getEditor, getCurrentEditPath, setIsDirty } from './project-preview-state.js';

/**
 * Save the currently open file [保存当前打开的文件]
 */
export async function saveCurrentFile(): Promise<void> {
  const path = getCurrentEditPath();
  const editor = getEditor();
  if (!path || !editor) return;
  const nameEl = document.getElementById('filePreviewName');
  const contentEl = document.getElementById('filePreviewContent');

  const content = editor.getValue();
  const result = await projectApi.writeFile(path, content);
  if (result.success) {
    setIsDirty(false);
    nameEl?.classList.remove('dirty');
  } else {
    console.error('[ProjectPreview] Save failed:', result.error);
    // In-place error bar instead of native alert [就地错误条，替代原生 alert]
    const bar = document.createElement('div');
    bar.className = 'file-preview-error file-preview-save-error';
    bar.textContent = `保存失败: ${result.error || '未知错误'}`;
    contentEl?.prepend(bar);
    setTimeout(() => bar.remove(), 3000);
  }
}
