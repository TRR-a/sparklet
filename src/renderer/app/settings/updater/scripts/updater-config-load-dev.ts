// Settings: apply dev-environment lock to updater UI [设置 - 开发环境下锁定更新 UI]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { updateStatusText } from './updater-config-status.js';

/** Force-lock the updater controls when running in dev [开发环境强制锁定更新控件] */
export function applyDevLockUI(): void {
  const behaviorSelect = document.getElementById('updateBehaviorSelect') as HTMLSelectElement | null;
  const intervalSelect = document.getElementById('updateIntervalSelect') as HTMLSelectElement | null;
  const checkBtn = document.getElementById('checkNowBtn');
  const integrityCheckbox = document.getElementById('integrityCheckToggle') as HTMLInputElement | null;

  // Dev environment: force lock UI [开发环境：强制锁定 UI]
  if (behaviorSelect) behaviorSelect.value = 'disabled';
  if (intervalSelect) intervalSelect.value = '1800000';
  if (behaviorSelect) behaviorSelect.disabled = true;
  if (intervalSelect) intervalSelect.disabled = true;

  if (checkBtn) {
    (checkBtn as HTMLButtonElement).disabled = true;
    checkBtn.textContent = t('settings.devLock.checkBtn');
    (checkBtn as HTMLElement).title = t('settings.devLock.checkBtnTitle');
  }

  // Disable integrity check checkbox in dev environment [开发环境禁用完整性校验复选框]
  if (integrityCheckbox) {
    integrityCheckbox.checked = false;
    integrityCheckbox.disabled = true;
    (integrityCheckbox as HTMLElement).title = t('settings.devLock.integrityTitle');
  }

  updateStatusText(t('settings.devLock.statusText'), false);
}
