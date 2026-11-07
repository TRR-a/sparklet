// Update timer - scheduled auto check [更新定时器 - 定时自动检查]
// Pending/auto/manual triggers in update-check-triggers.ts [待处理/自动/手动触发在 update-check-triggers.ts]

import { getCheckInterval } from './config-manager.js';
import { updaterStateInternal } from './update-state.js';
import { autoCheckUpdate } from './update-check-triggers.js';

export {
  checkPendingUpdate,
  autoCheckUpdate,
  checkUpdateManually,
} from './update-check-triggers.js';

/**
 * Start the update timer [启动定时器]
 */
export function startUpdateTimer(): void {
  if (updaterStateInternal.checkTimer) {
    clearInterval(updaterStateInternal.checkTimer);
    updaterStateInternal.checkTimer = null;
  }

  getCheckInterval().then((interval: number) => {
    if (interval === 0) {
      console.log('[Updater] Timer: check on startup only');
      setTimeout(autoCheckUpdate, 5000);
      return;
    }

    console.log('[Updater] Timer started, interval:', interval, 'ms');
    setTimeout(() => {
      autoCheckUpdate();
      updaterStateInternal.checkTimer = setInterval(autoCheckUpdate, interval);
    }, 5000);
  }).catch(err => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Updater] Failed to start timer:', msg);
  });
}
