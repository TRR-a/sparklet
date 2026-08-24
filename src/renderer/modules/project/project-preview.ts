// Project file preview - CodeMirror editor and save support [项目文件预览 - CodeMirror 编辑器和保存]

import {
  EditorView,
  basicSetup,
  keymap,
} from '../../vendor/codemirror-vendor.bundle.js';
import type { Extension } from '@codemirror/state';
import { getLanguageExtension, isDarkTheme, blueTheme } from './project-codemirror.js';

/** Active CodeMirror editor view [当前 CodeMirror 编辑器实例] */
let editorView: EditorView | null = null;

/** Current editing file state [当前编辑文件状态] */
let currentEditPath: string | null = null;
let currentEditName: string | null = null;
let isDirty = false;

/**
 * Preview a file in the right panel [在右侧面板打开文件]
 */
export async function previewFile(filePath: string, fileName: string): Promise<void> {
  const previewEl = document.getElementById('filePreview');
  const nameEl = document.getElementById('filePreviewName');
  const contentEl = document.getElementById('filePreviewContent');
  if (!previewEl || !nameEl || !contentEl) return;

  // Reset edit state [重置编辑状态]
  currentEditPath = null;
  currentEditName = null;
  isDirty = false;
  nameEl.textContent = fileName;
  nameEl.classList.remove('dirty');
  contentEl.innerHTML = '<div class="file-preview-loading">加载中...</div>';

  // Show preview, hide note editor [显示预览，隐藏笔记编辑器]
  showFilePreviewPanel(true);

  const result = await window.projectAPI.readFile(filePath);
  if (!result.success) {
    contentEl.innerHTML = `<div class="file-preview-error">无法打开: ${result.error || '未知错误'}</div>`;
    return;
  }

  if (result.isBinary) {
    const sizeKB = ((result.size || 0) / 1024).toFixed(1);
    contentEl.innerHTML = `<div class="file-preview-binary">二进制文件 (${sizeKB} KB)<br>不支持编辑</div>`;
    return;
  }

  if (result.isImage && !result.content) {
    // Raster image: use file:// URL [光栅图片：使用 file:// URL]
    const img = document.createElement('img');
    img.src = `file:///${filePath.replace(/\\/g, '/')}`;
    img.className = 'file-preview-image';
    img.alt = fileName;
    contentEl.innerHTML = '';
    contentEl.appendChild(img);
  } else if (result.content !== undefined) {
    // Text or SVG: CodeMirror editor [文本或 SVG：CodeMirror 编辑器]
    currentEditPath = filePath;
    currentEditName = fileName;

    // Destroy previous editor if any [销毁之前的编辑器]
    if (editorView) {
      editorView.destroy();
      editorView = null;
    }

    contentEl.innerHTML = '';

    const extensions: Extension[] = [
      basicSetup,
      keymap.of([
        {
          key: 'Mod-s',
          run: () => {
            void saveCurrentFile();
            return true;
          },
        },
      ]),
      EditorView.updateListener.of(update => {
        if (update.docChanged && !isDirty) {
          isDirty = true;
          nameEl.classList.add('dirty');
        }
      }),
      EditorView.lineWrapping,
    ];

    // Language extension [语言扩展]
    const langExt = getLanguageExtension(fileName);
    if (langExt) extensions.push(langExt);

    // Blue dark theme [蓝色暗色主题]
    if (isDarkTheme()) extensions.push(...blueTheme);

    editorView = new EditorView({
      doc: result.content,
      extensions,
      parent: contentEl,
    });

    editorView.focus();
  } else {
    contentEl.innerHTML = '<div class="file-preview-error">不支持的文件类型</div>';
  }
}

/**
 * Save the currently open file [保存当前打开的文件]
 */
export async function saveCurrentFile(): Promise<void> {
  if (!currentEditPath || !editorView) return;
  const nameEl = document.getElementById('filePreviewName');

  const content = editorView.state.doc.toString();
  const result = await window.projectAPI.writeFile(currentEditPath, content);
  if (result.success) {
    isDirty = false;
    nameEl?.classList.remove('dirty');
  } else {
    alert(`保存失败: ${result.error || '未知错误'}`);
  }
}

/**
 * Show or hide the file preview panel [显示或隐藏文件预览面板]
 */
function showFilePreviewPanel(show: boolean): void {
  const previewEl = document.getElementById('filePreview');
  const colorPalette = document.querySelector('.color-palette') as HTMLElement | null;
  const noteTitle = document.getElementById('noteTitle');
  const editorToolbar = document.querySelector('.editor-toolbar') as HTMLElement | null;
  const noteArea = document.getElementById('noteArea');
  const notePreview = document.getElementById('notePreview');

  if (previewEl) previewEl.style.display = show ? 'flex' : 'none';
  if (colorPalette) colorPalette.style.display = show ? 'none' : '';
  if (noteTitle) noteTitle.style.display = show ? 'none' : '';
  if (editorToolbar) editorToolbar.style.display = show ? 'none' : '';
  if (noteArea) noteArea.style.display = show ? 'none' : '';
  if (notePreview) notePreview.style.display = show ? 'none' : '';
}

/**
 * Close file preview and restore note editor [关闭文件预览并恢复笔记编辑器]
 */
export function closeFilePreview(): void {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
  currentEditPath = null;
  currentEditName = null;
  isDirty = false;
  const nameEl = document.getElementById('filePreviewName');
  nameEl?.classList.remove('dirty');
  showFilePreviewPanel(false);
}
