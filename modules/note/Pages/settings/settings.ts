// Settings page - main entry point for settings window logic [设置页面 - 设置窗口逻辑入口]
// Handles language switching, window control, theme sync, and orchestrates all settings sections [处理语言切换、窗口控制、主题同步，并编排所有设置区域]

import { initI18n, loadLanguage, getCurrentLang, t } from '../../Modules/i18n.js';
import { showToast, bindToastListener } from '../../Base/toast.js';
import { loadTheme, setTheme, bindThemeBroadcastListener } from '../../Base/theme.js';
import { bindUpdaterDialogListener } from '../../Modules/updater-dialog.js';
import { storeApi, windowApi, appApi, broadcastApi } from '../../../../src/renderer/core/index.js';
import {
  loadUpdaterConfig,
  bindUpdaterEvents,
  loadUpdateHint
} from './updater-config.js';
import {
  loadCacheRetentionDays,
  applyCacheDevLock,
  bindCacheEvents,
  loadCacheInfo
} from './cache-settings.js';
import {
  applyImportExportDevLock,
  bindImportExportEvents
} from './config-io.js';

/**
 * Load theme and initialize i18n [加载主题并初始化 i18n]
 */
async function loadThemeAndI18n(): Promise<void> {
  const currentTheme = await loadTheme();
  const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement | null;
  if (themeSelect) themeSelect.value = currentTheme;

  const currentLang = await initI18n();
  const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement | null;
  if (languageSelect) languageSelect.value = currentLang;
  await loadUpdateHint();
  bindThemeBroadcastListener();
}

document.addEventListener('DOMContentLoaded', loadThemeAndI18n);

// ==================== Full initialization (updater config, cache, dialog, IO) [完整初始化 (更新配置、缓存、弹窗、导入导出)] ==========
document.addEventListener('DOMContentLoaded', async () => {
  await loadUpdaterConfig();
  bindUpdaterEvents();
  bindToastListener(t('toast.defaultMessage'));
  // Updater custom dialog listener [更新器自定义弹窗监听]
  bindUpdaterDialogListener();
  // Cache section init (read retention days first, then apply dev lock, bind events, load cache info) [缓存区初始化 (先读保留天数配置，再应用开发锁定、事件、加载缓存信息)]
  await loadCacheRetentionDays();
  applyImportExportDevLock();
  applyCacheDevLock();
  bindCacheEvents();
  bindImportExportEvents();
  await loadCacheInfo();
});

// Config change: re-apply dev environment locks (ensure isDev consistency) [配置变化时，重新应用一次开发环境锁定 (确保 isDev 一致)]
broadcastApi.onConfigChanged(() => {
  applyImportExportDevLock();
  applyCacheDevLock();
});

// ==================== Window control [窗口控制] ==========
const minimizeBtn = document.querySelector('.window-btn.minimize');
if (minimizeBtn) {
  minimizeBtn.addEventListener('click', () => {
    void windowApi.minimize();
  });
}

const closeBtn = document.querySelector('.window-btn.close');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    void windowApi.close();
  });
}

// ==================== Tool buttons [工具按钮] ==========
const openDevToolsBtn = document.getElementById('openDevToolsBtn');
if (openDevToolsBtn) {
  openDevToolsBtn.addEventListener('click', () => {
    void windowApi.openDevTools();
  });
}

const openAboutBtn = document.getElementById('openAboutBtn');
if (openAboutBtn) {
  openAboutBtn.addEventListener('click', () => {
    void windowApi.openAbout();
  });
}

const openOfficialSiteBtn = document.getElementById('openOfficialSiteBtn');
if (openOfficialSiteBtn) {
  openOfficialSiteBtn.addEventListener('click', async () => {
    try {
      const result = await appApi.openOfficialSite();
      if (!result || !result.success) {
        showToast(t('settings.toast.openSiteFailed'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('打开官网失败:', msg);
      showToast(t('settings.toast.openSiteFailed'));
    }
  });
}

// ==================== Copy official URL [复制官网地址] ==========
const officialUrlInput = document.getElementById('officialUrlInput') as HTMLInputElement | null;
const copyUrlBtn = document.getElementById('copyUrlBtn');

async function copyOfficialUrl(): Promise<void> {
  if (!officialUrlInput || !copyUrlBtn) return;
  const url = officialUrlInput.value;
  try {
    await navigator.clipboard.writeText(url);
    copyUrlBtn.textContent = '✅ ' + t('settings.copyUrlSuccess');
    setTimeout(() => { copyUrlBtn.textContent = t('settings.copyUrl'); }, 2000);
  } catch {
    officialUrlInput.select();
    document.execCommand('copy');
    copyUrlBtn.textContent = '✅ ' + t('settings.copyUrlSuccess');
    setTimeout(() => { copyUrlBtn.textContent = t('settings.copyUrl'); }, 2000);
  }
}

if (copyUrlBtn) {
  copyUrlBtn.addEventListener('click', copyOfficialUrl);
}
if (officialUrlInput) {
  officialUrlInput.addEventListener('click', () => {
    officialUrlInput.select();
  });
}

// ==================== Language switch [语言切换] ==========
const languageSelect = document.getElementById('languageSelect');
if (languageSelect) {
  languageSelect.addEventListener('change', async (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const newLang = target.value;
    const success = await loadLanguage(newLang);
    if (success) {
      showToast('✅ ' + t('settings.languageChangeSuccess'));
      console.log('语言已切换为：', newLang);
      await loadUpdateHint();
    }
  });
}

// ==================== Theme switch [主题切换] ==========
const themeSelect = document.getElementById('themeSelect');
if (themeSelect) {
  themeSelect.addEventListener('change', async (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const newTheme = target.value;
    setTheme(newTheme);
    await storeApi.set('theme', newTheme);
    await broadcastApi.notifyThemeChanged(newTheme);
  });
}
