// Settings: bind updater control events [设置 - 绑定更新控件事件]

import { saveUpdaterConfig } from 'sparklet/renderer/app/settings/updater/scripts/updater-config-save.js';
import { handleCheckNow } from 'sparklet/renderer/app/settings/updater/scripts/updater-config-check.js';

/** Wire change/click handlers on the updater controls [在更新控件上绑定 change/click 处理] */
export function bindUpdaterControls(): void {
  const behaviorSelect = document.getElementById('updateBehaviorSelect');
  const intervalSelect = document.getElementById('updateIntervalSelect');
  const integrityCheckbox = document.getElementById('integrityCheckToggle');

  if (behaviorSelect) {
    behaviorSelect.addEventListener('change', saveUpdaterConfig);
  }
  if (intervalSelect) {
    intervalSelect.addEventListener('change', saveUpdaterConfig);
  }
  if (integrityCheckbox) {
    integrityCheckbox.addEventListener('change', saveUpdaterConfig);
  }

  const checkBtn = document.getElementById('checkNowBtn');
  if (checkBtn) {
    checkBtn.addEventListener('click', handleCheckNow);
  }
}
