// Config IO: apply imported config [配置导入 - 应用导入结果]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast/toast.js';
import { loadUpdaterConfig } from '../../../updater/scripts/updater-config.js';
import { loadCacheRetentionDays, applyCacheDevLock, loadCacheInfo } from '../../scripts/cache-settings.js';
import { applyImportExportDevLock } from './config-io-devlock.js';

/** Reload every control so the UI matches the freshly imported config [重新加载全部控件，使 UI 与导入后的配置一致] */
export async function applyImportedConfig(): Promise<void> {
  await Promise.all([
    loadUpdaterConfig(),
    loadCacheRetentionDays()
  ]);
  applyImportExportDevLock();
  applyCacheDevLock();
  await loadCacheInfo();
  showToast(t('settings.toast.importSuccess'));
}
