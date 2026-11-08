// Update check: pending install on exit [更新检查 - 退出时应用待处理更新]

import { app } from 'electron';
import { installUpdate } from '../install/installer.js';
import { releaseTempDir } from '../temp/temp-manager.js';
import { updaterStateInternal } from '../startup/update-state.js';

/**
 * Check and apply pending update on app exit [检查并应用退出前的待处理更新]
 */
export async function checkPendingUpdate(): Promise<boolean> {
  if (!updaterStateInternal.pendingUpdate) return false;
  console.log('[Updater] Pending update detected, applying...');
  const { zipPath, tempDir, isManualDir, targetVersion } = updaterStateInternal.pendingUpdate;
  const result = await installUpdate(zipPath, tempDir, targetVersion);
  if (result.success) {
    updaterStateInternal.pendingUpdate = null;
    setTimeout(() => app.quit(), 500);
    return true;
  } else {
    console.error('[Updater] Pending update failed:', result.error);
    await releaseTempDir(tempDir, isManualDir);
    updaterStateInternal.pendingUpdate = null;
    return false;
  }
}
