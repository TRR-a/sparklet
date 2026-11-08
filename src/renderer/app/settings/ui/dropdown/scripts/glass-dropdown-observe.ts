// Glass dropdown: value sync observers [玻璃下拉 - 取值同步观察]

/**
 * Keep the label in sync on programmatic value/disabled changes and native change events
 * [代码程序化改值/禁用或原生 change 事件时保持标签同步]
 */
export function observeSelectValue(select: HTMLSelectElement, sync: () => void): void {
  // Keep the button label in sync when code sets select.value programmatically
  // [代码程序化设置 select.value 时同步按钮文字]
  // MutationObserver only catches setAttribute; also listen to 'change' events
  // which can be manually dispatched after programmatic value assignment
  // [MutationObserver 只能捕获 setAttribute；额外监听原生 change 事件（可在程序化赋值后手动派发）]
  new MutationObserver(sync).observe(select, { attributes: true, attributeFilter: ['value', 'disabled'] });
  select.addEventListener('change', () => sync());
}
