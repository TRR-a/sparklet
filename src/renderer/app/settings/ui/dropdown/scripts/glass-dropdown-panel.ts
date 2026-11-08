// Glass dropdown: option panel rebuild [玻璃下拉 - 选项面板重建]

/**
 * Rebuild the option list inside the panel [重建面板中的选项列表]
 * @param select Hidden native select [隐藏的原生 select]
 * @param panel Dropdown panel element [下拉面板元素]
 * @param onPick Called after an item writes select.value + change [选中项写入 value 与 change 后调用]
 */
export function buildDropdownPanel(
  select: HTMLSelectElement,
  panel: HTMLElement,
  onPick: () => void
): void {
  panel.innerHTML = '';
  for (const opt of Array.from(select.options)) {
    const item = document.createElement('div');
    item.className = 'glass-dropdown-item' + (opt.value === select.value ? ' active' : '');
    item.textContent = opt.textContent || '';
    item.addEventListener('click', () => {
      select.value = opt.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      onPick();
    });
    panel.appendChild(item);
  }
}
