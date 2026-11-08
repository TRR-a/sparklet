// Custom tooltip: event bindings [自定义提示 - 事件接线]

import { positionTooltip } from 'sparklet/renderer/shared/ui/tooltip/custom-tooltip-position.js';

/**
 * Bind hover / hide listeners for the tooltip [接线悬停显示与隐藏监听]
 * @param getTip current tooltip element (may be null) [当前提示元素 (可为空)]
 * @param resolveText resolves the displayed text for a target [解析目标元素显示的文本]
 */
export function bindTooltipEvents(
  getTip: () => HTMLElement | null,
  resolveText: (el: Element) => string
): void {
  document.addEventListener('mouseover', (e) => {
    const el = (e.target as Element).closest?.('[data-tooltip],[data-i18n-tooltip]');
    if (!el) return;
    const tipEl = getTip();
    if (!tipEl) return;
    const text = resolveText(el);
    if (!text) return;
    tipEl.textContent = text;
    tipEl.classList.add('show');
    positionTooltip(tipEl, el);
  });

  document.addEventListener('mouseout', (e) => {
    const el = (e.target as Element).closest?.('[data-tooltip],[data-i18n-tooltip]');
    if (el) getTip()?.classList.remove('show');
  });

  // Hide on scroll/click [滚动或点击时隐藏]
  window.addEventListener('scroll', () => getTip()?.classList.remove('show'), true);
  document.addEventListener('click', () => getTip()?.classList.remove('show'));
}
