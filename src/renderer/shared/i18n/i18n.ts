// i18n module - internationalization support [i18n 模块 - 多语言国际化支持]
// Provides page text, placeholder, tooltip translation and language switching [提供页面文本、占位符、工具提示等翻译功能]
//
// Split out [已拆分]：state → i18n-state.ts, t() → i18n-t.ts,
// DOM application → i18n-apply.ts.

import { storeApi, broadcastApi } from 'sparklet/renderer/shared/index.js';
import { setTranslations, setCurrentLang } from './i18n-state.js';
import { applyTranslations } from './i18n-apply.js';

export { t } from './i18n-t.js';
export { getCurrentLang } from './i18n-state.js';

/**
 * Load specified language pack and update all translated text on the page [加载指定语言包并更新页面所有翻译文本]
 * @param lang Language code, e.g. zh-CN/en/ja/ko/fr/de/es/pt-BR/ru [语言代码]
 * @param isBroadcast Whether triggered by broadcast (avoids re-broadcasting) [是否为广播触发]
 * @returns Whether loading succeeded [加载是否成功]
 */
export async function loadLanguage(lang: string, isBroadcast: boolean = false): Promise<boolean> {
  try {
    // Async load language pack JSON file [异步加载语言包 JSON 文件]
    const response = await fetch(`../locales/${lang}.json`);
    if (!response.ok) throw new Error('语言包加载失败');
    setTranslations(await response.json() as Record<string, string>);
    setCurrentLang(lang);

    applyTranslations();

    // When not triggered by broadcast, save setting and broadcast language change event [非广播触发时，保存设置并广播语言切换事件]
    if (!isBroadcast) {
      await storeApi.set('language', lang);
      await broadcastApi.notifyLanguageChanged(lang);
    }

    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('语言包加载失败:', msg);
    return false;
  }
}

/**
 * Initialize i18n system: auto-called on page load [初始化多语言系统：页面加载时自动调用]
 * @returns Currently loaded language code [当前加载的语言代码]
 */
export async function initI18n(): Promise<string> {
  // Read saved language setting from local storage, default to English [从本地存储读取保存的语言设置，默认英语]
  const savedLang = await storeApi.get<string>('language') || 'en';
  await loadLanguage(savedLang, true);

  // Listen for language broadcast from main process to update all windows in real-time [监听主进程的语言切换广播，实时更新所有窗口]
  broadcastApi.onLanguageBroadcast((lang: unknown) => {
    loadLanguage(lang as string, true);
  });

  return savedLang;
}
