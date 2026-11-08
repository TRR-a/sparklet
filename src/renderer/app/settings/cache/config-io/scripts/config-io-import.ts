// Config IO: import handler [配置导入导出 - 导入处理]
//
// Split out [已拆分]：apply result → config-io-import-apply.ts,
// failure toasts → config-io-import-error.ts.

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast/toast.js';
import { showCustomConfirm } from 'sparklet/renderer/shared/ui/dialog/custom-dialog.js';
import { updaterApi } from 'sparklet/renderer/shared/index.js';
import { applyImportedConfig } from 'sparklet/renderer/app/settings/cache/config-io/scripts/config-io-import-apply.js';
import { reportImportFailure, reportImportError } from 'sparklet/renderer/app/settings/cache/config-io/scripts/config-io-import-error.js';

/**
 * Handle import updater config button click [处理导入更新配置按钮点击]
 */
export async function handleImportUpdaterConfig(): Promise<void> {
  if (!window.sparklet) {
    showToast(t('settings.toast.importUnsupported'));
    return;
  }

  // Second confirmation (avoid accidental overwrite of existing settings) [先二次确认 (避免误点覆盖现有设置)]
  const ok = await showCustomConfirm({
    title: t('confirm.importConfig.title'),
    message: t('confirm.importConfig.message'),
    okText: t('confirm.importConfig.ok'),
    cancelText: t('confirm.default.cancel'),
    okDanger: false
  });
  if (!ok) return;

  try {
    const result = await updaterApi.importConfig();
    if (!result) {
      showToast(t('settings.toast.importFailed'));
      return;
    }
    if (result.canceled) return; // User canceled file selection [用户取消选文件]

    if (result.success && result.config) {
      await applyImportedConfig();
    } else {
      reportImportFailure(result.error);
    }
  } catch (err) {
    reportImportError(err);
  }
}
