// Project preview: raster image rendering [项目预览 - 光栅图片渲染]

/**
 * Render a raster image via a file:// URL [用 file:// URL 渲染光栅图片]
 */
export function renderPreviewImage(contentEl: HTMLElement, filePath: string, fileName: string): void {
  // Raster image: use file:// URL [光栅图片：使用 file:// URL]
  const img = document.createElement('img');
  img.src = `file:///${filePath.replace(/\\/g, '/')}`;
  img.className = 'file-preview-image';
  img.alt = fileName;
  contentEl.innerHTML = '';
  contentEl.appendChild(img);
}
