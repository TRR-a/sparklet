// Config IO: import failure reporting [配置导入 - 失败提示]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast.js';

/** Show the import failure toast for an unsuccessful result [为失败的导入结果弹出失败提示] */
export function reportImportFailure(error: string | undefined): void {
  if (error) {
    showToast(t('settings.toast.importFailedPrefix') + error);
    return;
  }
  showToast(t('settings.toast.importFailed'));
}

/** Show the toast used when the API call throws [API 抛异常时的失败提示] */
export function reportImportError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('导入更新配置失败:', msg);
  showToast(t('settings.toast.importFailed'));
}
