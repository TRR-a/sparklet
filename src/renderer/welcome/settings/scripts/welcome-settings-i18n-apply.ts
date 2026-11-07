// Kernel settings window i18n: apply to DOM [内核设置窗口 i18n - 应用到 DOM]

import { t } from './welcome-settings-i18n.js';

/** Apply translations to all [data-i18n] / [data-i18n-tooltip] nodes [把译文应用到所有 i18n 标记节点] */
export function applyI18n(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-tooltip]').forEach((el) => {
    const key = el.dataset.i18nTooltip;
    if (key) el.dataset.tooltip = t(key);
  });
}
