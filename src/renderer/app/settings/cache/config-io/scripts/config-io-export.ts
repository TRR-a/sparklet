// Config IO: export handler [配置导入导出 - 导出处理]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast/toast.js';
import { updaterApi } from 'sparklet/renderer/shared/index.js';

/**
 * Handle export updater config button click [处理导出更新配置按钮点击]
 */
export async function handleExportUpdaterConfig(): Promise<void> {
  if (!window.sparklet) {
    showToast(t('settings.toast.exportUnsupported'));
    return;
  }
  try {
    const result = await updaterApi.exportConfig();
    if (!result) {
      showToast(t('settings.toast.exportFailed'));
      return;
    }
    if (result.canceled) return; // User clicked cancel, no prompt [用户点了取消，不提示]
    if (result.success && result.filePath) {
      const name = (result.filePath.match(/[^\\/]+$/) || [])[0] || result.filePath;
      showToast(t('settings.toast.exportSuccess').replace('{name}', name));
    } else if (result.error) {
      showToast(t('settings.toast.exportFailedPrefix') + result.error);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('导出更新配置失败:', msg);
    showToast(t('settings.toast.exportFailed'));
  }
}
