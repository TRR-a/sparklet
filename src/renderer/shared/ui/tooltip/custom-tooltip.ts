// Custom tooltip - self-drawn hover tooltip replacing the native title bubble
// [自定义悬停提示 - 取代系统原生 title 气泡]
// Usage: add data-tooltip="text" (or data-i18n-tooltip="key") to any element,
// then call initCustomTooltip() once on window load.
// [用法：给元素加 data-tooltip="文本"（或 data-i18n-tooltip="键"），窗口加载时调用 initCustomTooltip()]
//
// Split out [已拆分]：positioning → custom-tooltip-position.ts, listeners → custom-tooltip-bind.ts.

import { bindTooltipEvents } from 'sparklet/renderer/shared/ui/tooltip/custom-tooltip-bind.js';

let tooltipEl: HTMLDivElement | null = null;
let initialized = false;

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

  bindTooltipEvents(() => tooltipEl, resolveText);
}
