// Kernel welcome i18n: language state [内核欢迎页 i18n - 语言状态]

let currentLang = 'en';

/** Current kernel language code [当前内核语言代码] */
export function getLang(): string {
  return currentLang;
}

/** Set kernel language (normalizes to en / zh-CN) [设置内核语言 (归一化为 en / zh-CN)] */
export function setLang(lang: unknown): void {
  currentLang = lang === 'zh-CN' ? 'zh-CN' : 'en';
}

/** Read the active language code (for translation lookup) [读取当前语言代码 (供翻译查找)] */
export function readLang(): string {
  return currentLang;
}
