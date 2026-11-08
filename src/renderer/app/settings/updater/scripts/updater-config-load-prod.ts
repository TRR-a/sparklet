// Settings: apply loaded updater config to UI [设置 - 把加载到的更新配置应用到 UI]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import type { UpdaterConfig } from 'sparklet/shared/types/updater/updater.js';
import { updateStatusText } from './updater-config-status.js';

/** Apply the production config to the updater controls [生产环境把配置应用到更新控件] */
export function applyProdConfigUI(updaterConfig: UpdaterConfig): void {
  const behaviorSelect = document.getElementById('updateBehaviorSelect') as HTMLSelectElement | null;
  const intervalSelect = document.getElementById('updateIntervalSelect') as HTMLSelectElement | null;
  const checkBtn = document.getElementById('checkNowBtn');
  const integrityCheckbox = document.getElementById('integrityCheckToggle') as HTMLInputElement | null;

  // Production: normal load [生产环境：正常加载]
  if (behaviorSelect) behaviorSelect.value = updaterConfig.updateBehavior || 'auto';
  if (intervalSelect) intervalSelect.value = String(updaterConfig.checkInterval || 86400000);
  if (behaviorSelect) behaviorSelect.disabled = false;
  if (intervalSelect && behaviorSelect) intervalSelect.disabled = behaviorSelect.value === 'disabled';

  if (checkBtn) {
    (checkBtn as HTMLButtonElement).disabled = false;
    checkBtn.textContent = t('settings.checkNow');
    (checkBtn as HTMLElement).title = '';
  }

  // Load integrity check checkbox [加载完整性校验复选框]
  if (integrityCheckbox) {
    integrityCheckbox.checked = updaterConfig.integrityCheck !== false; // Default true [默认 true]
    integrityCheckbox.disabled = false;
    (integrityCheckbox as HTMLElement).title = '';
  }

  updateStatusText(t('settings.status.ready'));
}
