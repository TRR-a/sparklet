// Glass dropdown: label sync from select [玻璃下拉 - 按钮文案同步]

/**
 * Sync the button label/disabled state from the hidden select
 * [从隐藏的 select 同步按钮文案与禁用态]
 */
export function syncDropdownLabel(select: HTMLSelectElement, btn: HTMLButtonElement): void {
  const opt = select.options[select.selectedIndex];
  const label = btn.querySelector('.gd-label')!;
  label.textContent = opt ? opt.textContent : '';
  btn.disabled = select.disabled;
  btn.style.opacity = select.disabled ? '0.5' : '';
  btn.style.cursor = select.disabled ? 'not-allowed' : '';
}
