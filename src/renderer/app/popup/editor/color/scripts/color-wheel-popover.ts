// Color wheel: popover toggle & outside close [色环 - 弹层切换与外部关闭]

/**
 * Bind popover open/close interactions [绑定弹层开关交互]
 * @param btn Trigger button [触发按钮]
 * @param popover Popover element [弹层元素]
 */
export function bindPopoverToggle(btn: HTMLElement, popover: HTMLElement): void {
  // Toggle popover [切换弹层]
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const visible = popover.style.display !== 'none';
    popover.style.display = visible ? 'none' : 'flex';
    if (!visible) {
      // Position below the button [定位到按钮下方]
      const rect = btn.getBoundingClientRect();
      popover.style.left = `${rect.left}px`;
      popover.style.top = `${rect.bottom + 6}px`;
    }
  });

  // Close on outside click [点击外部关闭]
  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target as Node) && e.target !== btn) {
      popover.style.display = 'none';
    }
  });
}
