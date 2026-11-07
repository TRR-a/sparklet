// Kernel welcome i18n: apply to DOM [内核欢迎页 i18n - 应用到 DOM]

import { t } from './welcome-i18n.js';

export function applyI18n(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
}
