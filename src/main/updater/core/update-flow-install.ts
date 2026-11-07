// Update flow: restart prompt + install stage [更新流程 - 重启确认与安装阶段]

import { app } from 'electron';
import { installUpdate } from './installer.js';
import { setConfigItem } from './config-manager.js';
import { showRestartDialog } from '../dialog/dialog.js';
import { updaterStateInternal } from './update-state.js';
import { releaseTempDir } from './temp-manager.js';

/** Outcome of the install stage [安装阶段结果] */
export type InstallStageResult =
  | { status: 'later' }
  | { status: 'installed' }
  | { status: 'failed'; error: string | null };

/**
 * Ask for restart, then either defer or install immediately [询问重启，随后选择延迟或立即安装]
 */
export async function runInstallStage(params: {
  latestVersion: string;
  entry: Parameters<typeof showRestartDialog>[1];
  zipPath: string;
  tempDir: string;
  isManualDir: boolean;
  onProgress?: (msg: string, percent: number) => void;
}): Promise<InstallStageResult> {
  const { latestVersion, entry, zipPath, tempDir, isManualDir, onProgress } = params;

  const restartResult = await showRestartDialog(latestVersion, entry);
  const restartConfirmed = restartResult.buttonIndex === 0;
  const laterConfirmed = restartResult.buttonIndex === 1;
  const timeoutOccurred = !!restartResult.timedOut;

  if (laterConfirmed) {
    updaterStateInternal.pendingUpdate = { zipPath, tempDir, isManualDir, targetVersion: latestVersion };
    console.log('[Updater] User chose later, update will be applied on app exit' + (timeoutOccurred ? ' (timeout triggered)' : ''));
    await setConfigItem('lastCheckTime', new Date().toISOString());
    return { status: 'later' };
  }

  // restartConfirmed is implied here [这里隐含 restartConfirmed]
  void restartConfirmed;
  onProgress && onProgress('Installing update...', 95);
  const installResult = await installUpdate(zipPath, tempDir, latestVersion, (msg, pct) => {
    onProgress && onProgress(msg, 95 + Math.round(pct * 0.05));
  });
  if (!installResult.success) {
    await releaseTempDir(tempDir, isManualDir);
    return { status: 'failed', error: installResult.error };
  }

  onProgress && onProgress('Update complete, restarting...', 100);
  updaterStateInternal.pendingUpdate = null;
  await setConfigItem('lastCheckTime', new Date().toISOString());
  setTimeout(() => app.quit(), 500);
  return { status: 'installed' };
}
