// Kernel settings window i18n [内核设置窗口 i18n]
//
// Split out [已拆分]：string table → welcome-settings-i18n-strings.ts,
// DOM application → welcome-settings-i18n-apply.ts.

import { STRINGS } from 'sparklet/renderer/welcome/settings/scripts/welcome-settings-i18n-strings.js';

export { applyI18n } from 'sparklet/renderer/welcome/settings/scripts/welcome-settings-i18n-apply.js';

let currentLang = 'en';

export function t(key: string): string {
  return STRINGS[currentLang]?.[key] ?? STRINGS.en[key] ?? key;
}

/** Current settings-window language [当前设置窗口语言] */
export function getLang(): string {
  return currentLang;
}

/** Set settings-window language (normalizes to en / zh-CN) [设置语言 (归一化为 en / zh-CN)] */
export function setLang(lang: unknown): void {
  currentLang = lang === 'zh-CN' ? 'zh-CN' : 'en';
}
