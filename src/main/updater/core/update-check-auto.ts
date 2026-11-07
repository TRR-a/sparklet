// Update check: automatic timer trigger [更新检查 - 定时器自动触发]

import { app } from 'electron';
import { getUpdateBehavior } from './config-manager.js';
import { updaterStateInternal } from './update-state.js';
import { performUpdate } from './update-flow.js';

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
