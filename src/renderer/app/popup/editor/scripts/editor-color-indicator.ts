// Editor: active color indicator [编辑器 - 颜色选中指示]

/**
 * Update active color indicator [更新颜色选中状态]
 */
export function updateActiveColor(color: string): void {
  document.querySelectorAll('.color-option').forEach((btn: Element) => {
    btn.classList.toggle('active', btn.getAttribute('data-color') === color);
  });
}
