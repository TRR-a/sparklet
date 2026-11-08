// Settings window: settings sections bootstrap (updater / cache / IO) [设置窗口 - 各设置区引导 (更新/缓存/导入导出)]

import { bindToastListener } from 'sparklet/renderer/shared/ui/toast/toast.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { bindUpdaterDialogListener } from 'sparklet/renderer/shared/updater/dialog/updater-dialog.js';
import {
  loadUpdaterConfig,
  bindUpdaterEvents,
} from 'sparklet/renderer/app/settings/updater/scripts/updater-config.js';
import {
  loadCacheRetentionDays,
  applyCacheDevLock,
  bindCacheEvents,
  loadCacheInfo
} from 'sparklet/renderer/app/settings/cache/scripts/cache-settings.js';
import {
  applyImportExportDevLock,
  bindImportExportEvents
} from 'sparklet/renderer/app/settings/cache/config-io/scripts/config-io.js';

/**
 * Initialize updater, cache and import/export sections [初始化更新、缓存与导入导出区]
 */
export async function initSettingsSections(): Promise<void> {
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
}
