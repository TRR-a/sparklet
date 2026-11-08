// Glass dropdown: panel placement [玻璃下拉 - 面板定位]

/**
 * Position the panel below the button, flipping up when near the window bottom
 * [面板在按钮下方弹出，靠近窗口底部时向上翻]
 */
export function positionDropdownPanel(btn: HTMLElement, panel: HTMLElement): void {
  const r = btn.getBoundingClientRect();
  panel.style.minWidth = `${btn.offsetWidth}px`;
  const below = r.bottom + 260 < window.innerHeight;
  if (below) {
    panel.style.top = `${r.bottom + 4}px`;
    panel.style.left = `${r.left}px`;
    panel.style.bottom = 'auto';
  } else {
    panel.style.bottom = `${window.innerHeight - r.top + 4}px`;
    panel.style.left = `${r.left}px`;
    panel.style.top = 'auto';
  }
}
