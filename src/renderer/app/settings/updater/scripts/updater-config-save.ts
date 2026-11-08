// Settings: save updater config [设置 - 保存更新配置]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast/toast.js';
import type { UpdaterConfig } from 'sparklet/shared/types/updater/updater.js';
import { updaterApi } from 'sparklet/renderer/shared/index.js';
import { getIsDevEnvironment, getUpdaterConfig, setUpdaterConfig } from './updater-config-state.js';

/**
 * Save updater config to main process [保存更新配置到主进程]
 */
export async function saveUpdaterConfig(): Promise<void> {
  if (getIsDevEnvironment()) {
    showToast(t('settings.devLock.configLocked'), 'warning', 3000);
    return;
  }

  const behaviorSelect = document.getElementById('updateBehaviorSelect') as HTMLSelectElement | null;
  const intervalSelect = document.getElementById('updateIntervalSelect') as HTMLSelectElement | null;
  const integrityCheckbox = document.getElementById('integrityCheckToggle') as HTMLInputElement | null;

  const updaterConfig = getUpdaterConfig();
  if (!updaterConfig || !behaviorSelect || !intervalSelect) return;

  const newConfig: UpdaterConfig = {
    ...updaterConfig,
    updateBehavior: behaviorSelect.value as UpdaterConfig['updateBehavior'],
    checkInterval: parseInt(intervalSelect.value, 10)
  };

  // Save integrity check checkbox state [保存完整性校验复选框状态]
  if (integrityCheckbox) {
    newConfig.integrityCheck = integrityCheckbox.checked;
  }

  try {
    const result = await updaterApi.setConfig(newConfig);
    if (result.success) {
      setUpdaterConfig(newConfig);
      showToast(t('settings.toast.configSaved'));
      intervalSelect.disabled = behaviorSelect.value === 'disabled';
    } else {
      const msg = result.error || '';
      showToast(t('settings.toast.saveFailedPrefix') + msg);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('保存更新配置失败:', msg);
    showToast(t('settings.toast.saveFailedPermission'));
  }
}
