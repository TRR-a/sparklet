// Project preview: text / SVG editor mount [项目预览 - 文本或 SVG 编辑器挂载]

import { getLanguageForFile } from 'sparklet/renderer/shared/highlight/highlight.js';
import { createCodeEditor } from './code-editor.js';
import {
  getEditor, setEditor, setEditTarget, getIsDirty, setIsDirty,
} from './project-preview-state.js';
import { saveCurrentFile } from './project-preview-save.js';

/**
 * Mount the custom code editor for a text / SVG file [为文本或 SVG 文件挂载自研编辑器]
 */
export function renderPreviewText(
  contentEl: HTMLElement,
  nameEl: HTMLElement,
  filePath: string,
  fileName: string,
  content: string
): void {
  // Text or SVG: custom editor [文本或 SVG：自研编辑器]
  setEditTarget(filePath, fileName);

  // Destroy previous editor if any [销毁之前的编辑器]
  const prev = getEditor();
  if (prev) {
    prev.destroy();
    setEditor(null);
  }

  contentEl.innerHTML = '';

  setEditor(createCodeEditor(contentEl, {
    initialContent: content,
    language: getLanguageForFile(fileName),
    onChange: () => {
      if (!getIsDirty()) {
        setIsDirty(true);
        nameEl.classList.add('dirty');
      }
    },
    onSave: () => {
      void saveCurrentFile();
    },
  }));

  getEditor()!.focus();
}
