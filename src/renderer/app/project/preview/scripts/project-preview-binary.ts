// Project preview: binary file placeholder [项目预览 - 二进制文件占位]

/**
 * Show the binary-file placeholder with size [显示带文件大小的二进制占位]
 */
export function renderPreviewBinary(contentEl: HTMLElement, size: number | undefined): void {
  const sizeKB = ((size || 0) / 1024).toFixed(1);
  contentEl.innerHTML = `<div class="file-preview-binary">二进制文件 (${sizeKB} KB)<br>不支持编辑</div>`;
}
