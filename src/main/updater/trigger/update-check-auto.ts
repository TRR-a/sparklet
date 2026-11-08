// Update check: automatic timer trigger [更新检查 - 定时器自动触发]

import { app } from 'electron';
import { getUpdateBehavior } from 'sparklet/main/updater/config/config-manager.js';
import { updaterStateInternal } from 'sparklet/main/updater/startup/update-state.js';
import { performUpdate } from 'sparklet/main/updater/flow/update-flow.js';

/**
 * Auto check for updates (triggered by timer) [自动检查更新 (由定时器触发)]
 */
export async function autoCheckUpdate(): Promise<void> {
  if (!app.isPackaged) {
    console.log('[Updater] Development environment, auto-update disabled');
    return;
  }

  if (updaterStateInternal.isChecking || updaterStateInternal.isUpdating) return;
  if (updaterStateInternal.updateDisabled) return;

  const updateBehavior = await getUpdateBehavior();
  if (updateBehavior === 'disabled') return;

  updaterStateInternal.isChecking = true;
  console.log('[Updater] Auto-checking for updates...');
  await performUpdate(
    (msg, percent) => console.log(`[Updater] Auto-progress: ${msg} (${percent}%)`),
    (success, error) => {
      if (!success && error) {
        console.warn('[Updater] Auto-check failed:', error);
      }
      updaterStateInternal.isChecking = false;
    }
  );
  updaterStateInternal.isChecking = false;
}
