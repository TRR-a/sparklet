// Settings page - main entry point for settings window logic [设置页面 - 设置窗口逻辑入口]
// Handles language switching, window control, theme sync, and orchestrates all settings sections [处理语言切换、窗口控制、主题同步，并编排所有设置区域]
//
// Pieces split out [已拆分]：theme+i18n → settings-theme-i18n.ts,
// sections (updater/cache/IO) → settings-sections-init.ts,
// cleanup buttons → settings-cleanup.ts, toolbar → settings-toolbar.ts,
// preference switches → settings-preferences.ts

import { installGlobalErrorHooks, broadcastApi } from 'sparklet/renderer/shared/index.js';
import { applyCacheDevLock } from '../cache/scripts/cache-settings.js';
import { applyImportExportDevLock } from '../cache/scripts/config-io.js';
import { initCustomDropdowns } from '../ui/scripts/custom-dropdown.js';
import { loadThemeAndI18n } from './settings-theme-i18n.js';
import { initSettingsSections } from './settings-sections-init.js';
import { bindCleanupButtons } from './settings-cleanup.js';
import { bindWindowControl, bindToolButtons, bindCopyOfficialUrl } from './settings-toolbar.js';
import { bindPreferences } from './settings-preferences.js';

// Uncaught errors/rejections go to the note log file [未捕获错误/拒绝写入 note 日志]
installGlobalErrorHooks('main');

document.addEventListener('DOMContentLoaded', loadThemeAndI18n);

// ==================== Full initialization (updater config, cache, dialog, IO) [完整初始化 (更新配置、缓存、弹窗、导入导出)] ==========
document.addEventListener('DOMContentLoaded', async () => {
  await initSettingsSections();
  bindCleanupButtons();
});

// Config change: re-apply dev environment locks (ensure isDev consistency) [配置变化时，重新应用一次开发环境锁定 (确保 isDev 一致)]
broadcastApi.onConfigChanged(() => {
  applyImportExportDevLock();
  applyCacheDevLock();
});

bindWindowControl();
bindToolButtons();
bindCopyOfficialUrl();
void bindPreferences();

// Replace native selects with glassmorphism dropdowns [将原生 select 替换为玻璃下拉]
initCustomDropdowns();
