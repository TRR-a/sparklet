// i18n: global state [i18n - 全局状态]

let currentTranslations: Record<string, string> = {};
let currentLang = 'en';

/** Replace the active translation table [替换当前翻译表] */
export function setTranslations(table: Record<string, string>): void {
  currentTranslations = table;
}

/** Get the active translation table [获取当前翻译表] */
export function getTranslations(): Record<string, string> {
  return currentTranslations;
}

/** Set the active language code [设置当前语言代码] */
export function setCurrentLang(lang: string): void {
  currentLang = lang;
}

/** Get current selected language code [获取当前选中的语言代码] */
export function getCurrentLang(): string {
  return currentLang;
}
