// i18n: translate helper [i18n - 翻译取值]

import { getTranslations } from './i18n-state.js';

/**
 * Get translated text for current language (for JS dynamic content) [获取当前语言的翻译文本 (用于 JS 动态内容)]
 * @param key Translation key name [翻译键名]
 * @param params Optional parameters to replace {placeholder} in text [可选参数，替换文本中的 {占位符}]
 * @returns Translated text [翻译后的文本]
 */
export function t(key: string, params: Record<string, string> = {}): string {
  let text = getTranslations()[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`{${k}}`, 'g'), v);
  }
  return text;
}
