// Project preview: panel show/hide [项目预览 - 面板显示/隐藏]

/**
 * Show or hide the file preview panel [显示或隐藏文件预览面板]
 */
export function showFilePreviewPanel(show: boolean): void {
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
