// i18n: apply translations to the DOM [i18n - 把翻译应用到 DOM]

import { getTranslations } from 'sparklet/renderer/shared/i18n/i18n-state.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n-t.js';

/** Apply the active translation table to all tagged elements [把当前翻译表应用到所有带标记的元素] */
export function applyTranslations(): void {
  const translations = getTranslations();

  // Update all elements with data-i18n attribute text [更新所有带 data-i18n 属性的元素文本]
  document.querySelectorAll('[data-i18n]').forEach((el: Element) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = translations[key] || key;
    }
  });

  // Update all input placeholders with data-i18n-placeholder [更新所有带 data-i18n-placeholder 的输入框占位符]
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el: Element) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      (el as HTMLInputElement).placeholder = translations[key] || key;
    }
  });

  // Update all tooltips with data-i18n-title [更新所有带 data-i18n-title 的工具提示]
  document.querySelectorAll('[data-i18n-title]').forEach((el: Element) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      (el as HTMLElement).title = translations[key] || key;
    }
  });

  // Update theme toggle button aria-label [更新主题切换按钮的无障碍标签]
  const themeToggleBtn = document.getElementById('themeToggle');
  if (themeToggleBtn) {
    const currentTheme = document.body.dataset.theme;
    const labelKey = currentTheme === 'dark' ? 'theme.dark' : 'theme.light';
    themeToggleBtn.setAttribute('aria-label', t(labelKey));
  }
}
