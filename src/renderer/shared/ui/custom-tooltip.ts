// Custom tooltip - self-drawn hover tooltip replacing the native title bubble
// [自定义悬停提示 - 取代系统原生 title 气泡]
// Usage: add data-tooltip="text" (or data-i18n-tooltip="key") to any element,
// then call initCustomTooltip() once on window load.
// [用法：给元素加 data-tooltip="文本"（或 data-i18n-tooltip="键"），窗口加载时调用 initCustomTooltip()]

let tooltipEl: HTMLDivElement | null = null;
let initialized = false;

/** Position the tooltip above the target element [在目标元素上方定位提示气泡] */
function position(target: Element): void {
  if (!tooltipEl) return;
  const rect = (target as HTMLElement).getBoundingClientRect();
  const tipRect = tooltipEl.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  // Keep within viewport [不超出视口]
  left = Math.max(4, Math.min(left, window.innerWidth - tipRect.width - 4));
  let top = rect.top - tipRect.height - 6;
  if (top < 4) top = rect.bottom + 6; // flip below if no room above [上方空间不足则显示在下方]
  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

/**
 * Initialize the global custom tooltip [初始化全局自定义提示]
 * @param i18nFn optional function to resolve data-i18n-tooltip keys [可选：解析国际化键的函数]
 */
export function initCustomTooltip(i18nFn?: (key: string) => string): void {
  if (initialized) return;
  initialized = true;

  tooltipEl = document.createElement('div');
  tooltipEl.className = 'custom-tooltip';
  document.body.appendChild(tooltipEl);

  const resolveText = (el: Element): string => {
    const i18nKey = (el as HTMLElement).dataset.i18nTooltip;
    if (i18nKey && i18nFn) return i18nFn(i18nKey);
    return (el as HTMLElement).dataset.tooltip || '';
  };

  document.addEventListener('mouseover', (e) => {
    const el = (e.target as Element).closest?.('[data-tooltip],[data-i18n-tooltip]');
    if (!el || !tooltipEl) return;
    const text = resolveText(el);
    if (!text) return;
    tooltipEl.textContent = text;
    tooltipEl.classList.add('show');
    position(el);
  });

  document.addEventListener('mouseout', (e) => {
    const el = (e.target as Element).closest?.('[data-tooltip],[data-i18n-tooltip]');
    if (el && tooltipEl) tooltipEl.classList.remove('show');
  });

  // Hide on scroll/click [滚动或点击时隐藏]
  window.addEventListener('scroll', () => tooltipEl?.classList.remove('show'), true);
  document.addEventListener('click', () => tooltipEl?.classList.remove('show'));
}
