// Settings: manual "check now" action [设置 - 手动检查更新]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast.js';
import { updaterApi } from 'sparklet/renderer/shared/index.js';
import { getIsDevEnvironment } from './updater-config-state.js';
import { updateStatusText } from './updater-config-status.js';

/**
 * Handle manual check for updates [处理手动检查更新]
 */
export async function handleCheckNow(): Promise<void> {
  if (getIsDevEnvironment()) {
    showToast(t('settings.devLock.checkNowToast'), 'info', 10000);
    return;
  }

  const btn = document.getElementById('checkNowBtn') as HTMLButtonElement | null;
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = t('settings.status.checking');
  updateStatusText(t('settings.status.checkingUpdate'));

  try {
    await updaterApi.checkUpdateNow();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('手动检查失败:', msg);
    updateStatusText(t('settings.status.checkFailed'), true);
    btn.disabled = false;
    btn.textContent = t('settings.checkNow');
  }
}
