// Editor: markdown preview toggle [编辑器 - Markdown 预览切换]

import { renderMarkdown } from 'sparklet/renderer/shared/markdown/markdown.js';
import { saveCurrentNote } from 'sparklet/renderer/app/popup/note/scripts/note-operations.js';
import { getPreviewMode, setPreviewMode } from 'sparklet/renderer/app/popup/editor/scripts/editor-state.js';

/**
 * Toggle markdown preview mode [切换 Markdown 预览模式]
 */
export async function togglePreview(): Promise<void> {
  const textarea = document.getElementById('noteArea');
  const preview = document.getElementById('notePreview');
  const btn = document.getElementById('previewToggleBtn');
  if (!textarea || !preview || !btn) return;

  setPreviewMode(!getPreviewMode());

  if (getPreviewMode()) {
    await saveCurrentNote();
    preview.innerHTML = renderMarkdown((textarea as HTMLTextAreaElement).value);
    (textarea as HTMLElement).style.display = 'none';
    (preview as HTMLElement).style.display = 'block';
    btn.classList.add('active');
    btn.textContent = '✏️ 编辑';
  } else {
    (textarea as HTMLElement).style.display = 'block';
    (preview as HTMLElement).style.display = 'none';
    btn.classList.remove('active');
    btn.textContent = '👁️ 预览';
  }
}
