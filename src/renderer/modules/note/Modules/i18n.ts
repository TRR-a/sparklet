// i18n module - internationalization support [i18n 模块 - 多语言国际化支持]
// Provides page text, placeholder, tooltip translation and language switching [提供页面文本、占位符、工具提示等翻译功能]

// ==================== Global state [全局状态] ====================
let currentTranslations: Record<string, string> = {};
let currentLang = 'zh-CN';

/**
 * Load specified language pack and update all translated text on the page [加载指定语言包并更新页面所有翻译文本]
 * @param lang Language code, e.g. zh-CN/en/ja/ko/fr/de/es/pt-BR/ru [语言代码]
 * @param isBroadcast Whether triggered by broadcast (avoids re-broadcasting) [是否为广播触发]
 * @returns Whether loading succeeded [加载是否成功]
 */
export async function loadLanguage(lang: string, isBroadcast: boolean = false): Promise<boolean> {
  try {
    // Async load language pack JSON file [异步加载语言包 JSON 文件]
    const response = await fetch(`../shared/locales/${lang}.json`);
    if (!response.ok) throw new Error('语言包加载失败');
    currentTranslations = await response.json() as Record<string, string>;
    currentLang = lang;

    // Update all elements with data-i18n attribute text [更新所有带 data-i18n 属性的元素文本]
    document.querySelectorAll('[data-i18n]').forEach((el: Element) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = currentTranslations[key] || key;
      }
    });

    // Update all input placeholders with data-i18n-placeholder [更新所有带 data-i18n-placeholder 的输入框占位符]
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el: Element) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        (el as HTMLInputElement).placeholder = currentTranslations[key] || key;
      }
    });

    // Update all tooltips with data-i18n-title [更新所有带 data-i18n-title 的工具提示]
    document.querySelectorAll('[data-i18n-title]').forEach((el: Element) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        (el as HTMLElement).title = currentTranslations[key] || key;
      }
    });

    // Update theme toggle button aria-label [更新主题切换按钮的无障碍标签]
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
      const currentTheme = document.body.dataset.theme;
      const labelKey = currentTheme === 'dark' ? 'theme.dark' : 'theme.light';
      themeToggleBtn.setAttribute('aria-label', t(labelKey));
    }

    // When not triggered by broadcast, save setting and broadcast language change event [非广播触发时，保存设置并广播语言切换事件]
    if (!isBroadcast) {
      await window.electronStore.set('language', lang);
      await window.electronAPI.invoke('language-changed', lang);
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
  // Read saved language setting from local storage, default to Simplified Chinese [从本地存储读取保存的语言设置，默认简体中文]
  const savedLang = await window.electronStore.get('language') as string || 'zh-CN';
  await loadLanguage(savedLang, true);

  // Listen for language broadcast from main process to update all windows in real-time [监听主进程的语言切换广播，实时更新所有窗口]
  window.electronAPI.on('language-broadcast', (lang: unknown) => {
    loadLanguage(lang as string, true);
  });

  return savedLang;
}

/**
 * Get translated text for current language (for JS dynamic content) [获取当前语言的翻译文本 (用于 JS 动态内容)]
 * @param key Translation key name [翻译键名]
 * @param params Optional parameters to replace {placeholder} in text [可选参数，替换文本中的 {占位符}]
 * @returns Translated text [翻译后的文本]
 */
export function t(key: string, params: Record<string, string> = {}): string {
  let text = currentTranslations[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`{${k}}`, 'g'), v);
  }
  return text;
}

/**
 * Get current selected language code [获取当前选中的语言代码]
 */
export function getCurrentLang(): string {
  return currentLang;
}
