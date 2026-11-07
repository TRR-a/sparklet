// Settings: updater status text [设置 - 更新状态文本]

/**
 * Update status text display [更新状态文本显示]
 */
export function updateStatusText(text: string, isError: boolean = false): void {
  const statusEl = document.getElementById('updaterStatus');
  if (!statusEl) return;
  statusEl.textContent = text;
  (statusEl as HTMLElement).style.color = isError ? '#ef4444' : '';
}
