// Custom tooltip: positioning [自定义提示 - 定位]

/** Position the tooltip above the target element [在目标元素上方定位提示气泡] */
export function positionTooltip(tipEl: HTMLElement | null, target: Element): void {
  if (!tipEl) return;
  const rect = (target as HTMLElement).getBoundingClientRect();
  const tipRect = tipEl.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  // Keep within viewport [不超出视口]
  left = Math.max(4, Math.min(left, window.innerWidth - tipRect.width - 4));
  let top = rect.top - tipRect.height - 6;
  if (top < 4) top = rect.bottom + 6; // flip below if no room above [上方空间不足则显示在下方]
  tipEl.style.left = `${left}px`;
  tipEl.style.top = `${top}px`;
}
