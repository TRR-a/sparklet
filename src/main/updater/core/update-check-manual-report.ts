// Update check: manual progress / result reporting [更新检查 - 手动触发的进度与结果上报]
//
// Split out [已拆分]：progress forwarding → update-check-manual-progress.ts,
// failure feedback → update-check-manual-feedback.ts.

import { BrowserWindow } from 'electron';
import { updaterStateInternal } from './update-state.js';
import { notifyManualFailure } from './update-check-manual-feedback.js';

export { reportManualProgress } from './update-check-manual-progress.js';

/**
 * Completion callback: reset state, push status, toast on failure [完成回调：重置状态、推送状态、失败时 toast]
 */
export function reportManualResult(
  win: BrowserWindow | null
): (success: boolean, error?: string | null, friendlyError?: string | null) => void {
  return (success: boolean, error?: string | null, friendlyError?: string | null) => {
    updaterStateInternal.isChecking = false;
    if (win) {
      win.webContents.send('updater:status-change', { checking: false });
      if (success) {
        win.webContents.send('updater:status-change', { done: true });
      }
    }
    if (success) {
      console.log('[Updater] Manual update completed');
      return;
    }
    if (error) {
      notifyManualFailure(win, error, friendlyError ?? null);
    }
  };
}
