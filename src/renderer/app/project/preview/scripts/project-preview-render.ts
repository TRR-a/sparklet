// Project preview: render file into the right panel [项目预览 - 在右侧面板渲染文件]
// Image in project-preview-image.ts, binary placeholder in project-preview-binary.ts,
// text editor in project-preview-text.ts [图片在 project-preview-image.ts，二进制占位在 project-preview-binary.ts，文本编辑器在 project-preview-text.ts]

import { projectApi } from 'sparklet/renderer/app/project/api/scripts/project-api.js';
import {
  setEditTarget, setIsDirty,
} from 'sparklet/renderer/app/project/preview/scripts/project-preview-state.js';
import { showFilePreviewPanel } from 'sparklet/renderer/app/project/preview/scripts/project-preview-panel.js';
import { renderPreviewImage } from 'sparklet/renderer/app/project/preview/scripts/project-preview-image.js';
import { renderPreviewBinary } from 'sparklet/renderer/app/project/preview/scripts/project-preview-binary.js';
import { renderPreviewText } from 'sparklet/renderer/app/project/preview/scripts/project-preview-text.js';

/**
 * Preview a file in the right panel [在右侧面板打开文件]
 */
export async function previewFile(filePath: string, fileName: string): Promise<void> {
  const previewEl = document.getElementById('filePreview');
  const nameEl = document.getElementById('filePreviewName');
  const contentEl = document.getElementById('filePreviewContent');
  if (!previewEl || !nameEl || !contentEl) return;

  // Reset edit state [重置编辑状态]
  setEditTarget(null, null);
  setIsDirty(false);
  nameEl.textContent = fileName;
  nameEl.classList.remove('dirty');
  contentEl.innerHTML = '<div class="file-preview-loading">加载中...</div>';

  // Show preview, hide note editor [显示预览，隐藏笔记编辑器]
  showFilePreviewPanel(true);

  const result = await projectApi.readFile(filePath);
  if (!result.success) {
    contentEl.innerHTML = `<div class="file-preview-error">无法打开: ${result.error || '未知错误'}</div>`;
    return;
  }

  if (result.isBinary) {
    renderPreviewBinary(contentEl, result.size);
    return;
  }

  if (result.isImage && !result.content) {
    renderPreviewImage(contentEl, filePath, fileName);
  } else if (result.content !== undefined) {
    renderPreviewText(contentEl, nameEl, filePath, fileName, result.content);
  } else {
    contentEl.innerHTML = '<div class="file-preview-error">不支持的文件类型</div>';
  }
}
