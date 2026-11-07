// Cache retention: save to main-process config [缓存保留天数 - 保存到主进程配置]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { updaterApi } from 'sparklet/renderer/shared/index.js';
import { clampRetentionDays } from './cache-retention-constants.js';
import { getRetentionSaveTimer, setRetentionSaveTimer } from './cache-retention-state.js';

/**
 * Save retention days to main process config (debounced 250ms on slider drag to avoid high-frequency IPC) [保存到主进程配置 (滑杆拖动时防抖 250ms 再提交，避免高频 IPC)]
 * @param onSaved Optional callback after successful save (e.g. refresh cache info) [保存成功后的可选回调 (如刷新缓存信息)]
 */
export async function saveRetentionDays(
  days: number,
  immediate: boolean = false,
  onSaved?: () => void | Promise<void>
): Promise<void> {
  if (!window.sparklet) return;
  const safeDays = clampRetentionDays(days);

  const pending = getRetentionSaveTimer();
  if (pending) {
    clearTimeout(pending);
    setRetentionSaveTimer(null);
  }

  const doSave = async (): Promise<void> => {
    setRetentionSaveTimer(null);
    try {
      const result = await updaterApi.setCacheRetentionDays(safeDays);
      if (result && result.success) {
        if (onSaved) await onSaved();
        const daysStr = result.days !== undefined ? String(result.days) : String(safeDays);
        const { showToast } = await import('sparklet/renderer/shared/ui/toast.js');
        showToast(t('settings.toast.retentionSaved').replace('{days}', daysStr));
      } else if (result && result.error) {
        const { showToast } = await import('sparklet/renderer/shared/ui/toast.js');
        showToast(t('settings.toast.saveFailedPrefix') + result.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('保存保留天数失败:', msg);
      const { showToast } = await import('sparklet/renderer/shared/ui/toast.js');
      showToast(t('settings.toast.saveFailed'));
    }
  };

  if (immediate) {
    await doSave();
  } else {
    setRetentionSaveTimer(setTimeout(doSave, 250));
  }
}
