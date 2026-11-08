// Update check: manual trigger [更新检查 - 手动触发]
// Guard in update-check-guard.ts, reporting in update-check-manual-report.ts
// [守卫在 update-check-guard.ts，上报在 update-check-manual-report.ts]

import { BrowserWindow } from 'electron';
import { updaterStateInternal } from 'sparklet/main/updater/startup/update-state.js';
import { performUpdate } from 'sparklet/main/updater/flow/update-flow.js';
import { canCheckManually } from 'sparklet/main/updater/trigger/update-check-guard.js';
import { reportManualProgress, reportManualResult } from 'sparklet/main/updater/trigger/update-check-manual-report.js';

/**
 * Manually trigger update check (user clicks "check now") [手动触发更新检查 (用户点击「立即检查」)]
 */
export function checkUpdateManually(): void {
  if (!canCheckManually()) return;

  updaterStateInternal.isChecking = true;
  console.log('[Updater] Manual check triggered');

  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.send('updater:status-change', { checking: true });
  }

  performUpdate(reportManualProgress(win), reportManualResult(win));
}
