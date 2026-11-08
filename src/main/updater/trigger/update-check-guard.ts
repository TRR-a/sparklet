// Update check: manual-trigger guard [更新检查 - 手动触发前置守卫]

import { app } from 'electron';
import { broadcastToast } from 'sparklet/main/updater/dialog/dialog.js';
import { updaterStateInternal } from 'sparklet/main/updater/startup/update-state.js';

/**
 * Check preconditions for a manual update check, toasting the reason when blocked
 * [检查手动更新的前置条件，被阻止时用 toast 说明原因]
 * @returns true when the check may proceed [可继续时返回 true]
 */
export function canCheckManually(): boolean {
  if (!app.isPackaged) {
    console.log('[Updater] Development environment, manual update disabled');
    broadcastToast({ key: 'updater.toast.devEnvDisabled' }, 'info', 10000);
    return false;
  }

  if (updaterStateInternal.updateDisabled) {
    console.log('[Updater] Update disabled, cannot check manually');
    broadcastToast({ key: 'updater.toast.disabledByCli' }, 'warning', 3000);
    return false;
  }

  if (updaterStateInternal.isChecking || updaterStateInternal.isUpdating) {
    broadcastToast({ key: 'updater.toast.checking' }, 'info', 3000);
    return false;
  }
  return true;
}
