/* 多语言国际化核心工具 - 全窗口通用 */
let currentTranslations = {};
let currentLang = 'zh-CN';

/**
 * 加载指定语言包，替换页面所有翻译文本
 * @param {string} lang 语言代码 zh-CN/en/ja/ko
 * @param {boolean} isBroadcast 是否为广播触发的切换（不重复广播）
 * @returns {boolean} 加载是否成功
 */
export async function loadLanguage(lang, isBroadcast = false) {
  try {
    // 加载语言包文件
    const response = await fetch(`../shared/locales/${lang}.json`);
    if (!response.ok) throw new Error('语言包加载失败');
    currentTranslations = await response.json();
    currentLang = lang;

    // 替换所有带data-i18n的元素文本
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = currentTranslations[key] || key;
    });

    // 替换所有带data-i18n-placeholder的占位符
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = currentTranslations[key] || key;
    });

    // 替换所有带data-i18n-title的tooltip提示
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = currentTranslations[key] || key;
    });

    // 替换主题切换按钮的aria-label
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
      const currentTheme = document.body.dataset.theme;
      const labelKey = currentTheme === 'dark' ? 'theme.dark' : 'theme.light';
      themeToggleBtn.setAttribute('aria-label', t(labelKey));
    }

    // 非广播触发时，通知主进程广播语言切换事件，同步所有窗口
    if (!isBroadcast) {
      await window.electronStore.set('language', lang);
      await window.electronAPI.invoke('language-changed', lang);
    }

    return true;
  } catch (err) {
    console.error('语言包加载失败:', err);
    return false;
  }
}

/**
 * 初始化多语言：页面加载时自动调用
 * @returns {string} 当前加载的语言代码
 */
export async function initI18n() {
  // 从本地存储读取语言，默认简体中文
  const savedLang = await window.electronStore.get('language') || 'zh-CN';
  await loadLanguage(savedLang, true);
  
  // 监听主进程的语言切换广播，实时更新
  window.electronAPI.on('language-broadcast', (lang) => {
    loadLanguage(lang, true);
  });

  return savedLang;
}

/**
 * 获取当前语言的翻译文本（JS动态内容用）
 * @param {string} key 翻译键名
 * @returns {string} 翻译后的文本
 */
export function t(key) {
  return currentTranslations[key] || key;
}

/**
 * 获取当前选中的语言代码
 * @returns {string} 当前语言代码
 */
export function getCurrentLang() {
  return currentLang;
}