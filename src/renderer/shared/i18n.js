// i18n.js - 多语言国际化工具
// 说明：提供应用的多语言支持，包括页面文本、占位符、提示等翻译功能

// ==================== 全局状态 ====================
let currentTranslations = {}; // 当前语言包数据
let currentLang = 'zh-CN'; // 当前语言代码

// ==================== 语言加载 ====================
/**
 * 加载指定语言包并更新页面所有翻译文本
 * @param {string} lang 语言代码，如 zh-CN/en/ja/ko/fr/de/es/pt-BR/ru
 * @param {boolean} isBroadcast 是否为广播触发的切换（避免重复广播）
 * @returns {boolean} 加载是否成功
 */
export async function loadLanguage(lang, isBroadcast = false) {
  try {
    // 异步加载语言包 JSON 文件
    const response = await fetch(`../shared/locales/${lang}.json`);
    if (!response.ok) throw new Error('语言包加载失败');
    currentTranslations = await response.json();
    currentLang = lang;

    // 更新所有带 data-i18n 属性的元素文本
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = currentTranslations[key] || key;
    });

    // 更新所有带 data-i18n-placeholder 属性的输入框占位符
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = currentTranslations[key] || key;
    });

    // 更新所有带 data-i18n-title 属性的工具提示
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = currentTranslations[key] || key;
    });

    // 更新主题切换按钮的无障碍标签
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
      const currentTheme = document.body.dataset.theme;
      const labelKey = currentTheme === 'dark' ? 'theme.dark' : 'theme.light';
      themeToggleBtn.setAttribute('aria-label', t(labelKey));
    }

    // 非广播触发时，保存设置并广播语言切换事件
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

// ==================== 初始化 ====================
/**
 * 初始化多语言系统：页面加载时自动调用
 * @returns {string} 当前加载的语言代码
 */
export async function initI18n() {
  // 从本地存储读取保存的语言设置，默认简体中文
  const savedLang = await window.electronStore.get('language') || 'zh-CN';
  await loadLanguage(savedLang, true);

  // 监听主进程的语言切换广播，实时更新所有窗口
  window.electronAPI.on('language-broadcast', (lang) => {
    loadLanguage(lang, true);
  });

  return savedLang;
}

// ==================== 工具函数 ====================
/**
 * 获取当前语言的翻译文本（用于 JS 动态内容）
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