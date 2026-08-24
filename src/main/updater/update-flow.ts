// Update flow - performUpdate core logic [更新流程 - performUpdate 核心逻辑]

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs-extra';
import { MAX_RETRY_COUNT } from './constants';
import { acquireTempDir, releaseTempDir } from './temp-manager';
import { checkForUpdates } from './check';
import { downloadWithRetry } from './download';
import { verifyReleaseManifest, verifyPackageIntegrity } from './verify';
import { installUpdate } from './installer';
import { setConfigItem, getUpdateBehavior } from './config-manager';
import * as cacheManager from './cache-manager';
import {
  promptRendererDialog,
  showUpdateDialog,
  showNotifyOnlyDialog,
  showRestartDialog,
  broadcastToast,
  formatFriendlyUpdateError,
} from './dialog';
import type { ProgressCallback, CompleteCallback } from './dialog';
import { updaterStateInternal } from './update-state';
import type { CheckResult, NetworkErrorType } from '../../shared/types/updater';

/**
 * Execute the complete update flow [执行完整的更新流程]
 */
export async function performUpdate(onProgress: ProgressCallback | null, onComplete: CompleteCallback | null): Promise<void> {
  if (updaterStateInternal.isUpdating) {
    console.warn('[Updater] Update already in progress');
    onComplete && onComplete(false, 'Update already in progress');
    return;
  }
  updaterStateInternal.isUpdating = true;
  let tempDir: string | null = null;
  let isManualDir = false;
  let zipPath: string | null = null;

  try {
    if (updaterStateInternal.updateDisabled) {
      console.log('[Updater] Update disabled, skipping');
      onComplete && onComplete(false, 'Update disabled');
      updaterStateInternal.isUpdating = false;
      return;
    }

    const updateBehavior = await getUpdateBehavior();
    if (updateBehavior === 'disabled') {
      console.log('[Updater] User disabled updates');
      onComplete && onComplete(true, null);
      updaterStateInternal.isUpdating = false;
      return;
    }

    onProgress && onProgress('Checking version...', 0);
    const checkResult: CheckResult = await checkForUpdates();
    if (checkResult.error) {
      console.error('[Updater] Version check failed:', checkResult.error);
      const friendly = formatFriendlyUpdateError(
        checkResult.error, checkResult.errorType as NetworkErrorType | null, 'check'
      );
      onComplete && onComplete(false, checkResult.error, friendly);
      updaterStateInternal.isUpdating = false;
      return;
    }
    if (!checkResult.hasUpdate) {
      console.log('[Updater] Already up to date');
      onComplete && onComplete(true, null);
      updaterStateInternal.isUpdating = false;
      await setConfigItem('lastCheckTime', new Date().toISOString());
      return;
    }

    const { currentVersion, latestVersion, zipUrl, manifestUrl } = checkResult;
    console.log('[Updater] New version found:', latestVersion);

    if (updateBehavior === 'notify-only') {
      const releaseUrl = `https://github.com/TRR-a/sparklet/releases/tag/v${latestVersion}`;
      const manifestResult = await verifyReleaseManifest(manifestUrl!, `v${latestVersion}`);
      if (manifestResult.success && manifestResult.entry) {
        await showNotifyOnlyDialog(currentVersion, manifestResult.entry, releaseUrl);
      } else {
        await promptRendererDialog('notify-only', {
          newVersion: `v${latestVersion}`,
          codename: 'N/A',
          releaseDate: 'N/A',
          releaseUrl
        });
      }
      await setConfigItem('lastCheckTime', new Date().toISOString());
      onComplete && onComplete(true, null);
      updaterStateInternal.isUpdating = false;
      return;
    }

    onProgress && onProgress('Fetching update metadata...', 3);
    const manifestResult = await verifyReleaseManifest(manifestUrl!, `v${latestVersion}`);
    if (!manifestResult.success) {
      const friendly = formatFriendlyUpdateError(
        manifestResult.error, null, 'download-manifest'
      );
      onComplete && onComplete(false, manifestResult.error, friendly);
      updaterStateInternal.isUpdating = false;
      return;
    }
    const entry = manifestResult.entry!;

    const confirmResult = await showUpdateDialog(currentVersion, entry);
    const userConfirmed = confirmResult.buttonIndex === 0;
    if (!userConfirmed) {
      console.log('[Updater] User cancelled update');
      onComplete && onComplete(true, null);
      updaterStateInternal.isUpdating = false;
      return;
    }

    onProgress && onProgress('Preparing temp directory...', 5);
    const tempResult = await acquireTempDir({
      showTempDirError: async () => {
        const res = await promptRendererDialog('temp-dir-error', {}, { fallbackResponse: { buttonIndex: 2 } });
        return res.buttonIndex;
      },
      showDirNotEmptyConfirm: async () => {
        const res = await promptRendererDialog('temp-dir-not-empty', {}, { fallbackResponse: { buttonIndex: 1 } });
        return res.buttonIndex;
      }
    });
    if (!tempResult.success) {
      onComplete && onComplete(false, 'Unable to acquire temp directory');
      updaterStateInternal.isUpdating = false;
      return;
    }
    tempDir = tempResult.path!;
    isManualDir = tempResult.isManual;
    console.log('[Updater] Using temp directory:', tempDir);

    onProgress && onProgress('Downloading update package...', 10);
    const zipFileName = `sparklet-v${latestVersion}-win-x86_64.zip`;
    zipPath = path.join(tempDir, zipFileName);

    const downloadResult = await downloadWithRetry(zipUrl!, zipPath, (percent) => {
      const progress = 10 + Math.round(percent * 0.5);
      onProgress && onProgress(`Downloading... ${percent}%`, progress);
    }, MAX_RETRY_COUNT);
    if (!downloadResult.success) {
      await releaseTempDir(tempDir, isManualDir);
      const friendly = formatFriendlyUpdateError(
        downloadResult.error, downloadResult.errorType as NetworkErrorType | null, 'download-zip'
      );
      onComplete && onComplete(false, downloadResult.error, friendly);
      updaterStateInternal.isUpdating = false;
      return;
    }

    onProgress && onProgress('Verifying file integrity...', 80);
    const integrityResult = await verifyPackageIntegrity(zipPath, entry);
    if (!integrityResult.success) {
      await fs.remove(zipPath).catch(() => {});
      await releaseTempDir(tempDir, isManualDir);
      const friendly = formatFriendlyUpdateError(
        integrityResult.error, integrityResult.errorType as NetworkErrorType | null, 'verify'
      );
      onComplete && onComplete(false, integrityResult.error, friendly);
      updaterStateInternal.isUpdating = false;
      return;
    }

    // ========== Sync downloaded ZIP to persistent cache (for rollback/reinstall) ========== [同步下载好的 ZIP 到持久缓存 (供回滚/重装使用)]
    onProgress && onProgress('Syncing to persistent cache...', 85);
    try {
      const versionWithV = `v${latestVersion}`;
      const packageHash = entry.packageHash || entry.hash || null;
      await cacheManager.registerCachedZip(zipPath!, versionWithV, packageHash);
    } catch (err) {
      // Cache write failure doesn't affect main flow, log and continue [缓存写入失败不影响主流程，打个日志继续]
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Updater] Failed to cache update zip (non-critical):', msg);
    }

    onProgress && onProgress('Ready to install...', 90);

    const restartResult = await showRestartDialog(latestVersion!, entry);
    const restartConfirmed = restartResult.buttonIndex === 0;
    const laterConfirmed = restartResult.buttonIndex === 1;
    const timeoutOccurred = !!restartResult.timedOut;

    if (laterConfirmed) {
      updaterStateInternal.pendingUpdate = { zipPath: zipPath!, tempDir: tempDir!, isManualDir, targetVersion: latestVersion! };
      console.log('[Updater] User chose later, update will be applied on app exit' + (timeoutOccurred ? ' (timeout triggered)' : ''));
      await setConfigItem('lastCheckTime', new Date().toISOString());
      onComplete && onComplete(true, null);
      updaterStateInternal.isUpdating = false;
      return;
    }

    // restartConfirmed is implied here [这里隐含 restartConfirmed]
    void restartConfirmed;
    onProgress && onProgress('Installing update...', 95);
    const installResult = await installUpdate(zipPath!, tempDir!, latestVersion!, (msg, pct) => {
      onProgress && onProgress(msg, 95 + Math.round(pct * 0.05));
    });
    if (!installResult.success) {
      await releaseTempDir(tempDir, isManualDir);
      const friendly = formatFriendlyUpdateError(
        installResult.error, null, 'install'
      );
      onComplete && onComplete(false, installResult.error, friendly);
      updaterStateInternal.isUpdating = false;
      return;
    }

    onProgress && onProgress('Update complete, restarting...', 100);
    updaterStateInternal.pendingUpdate = null;
    updaterStateInternal.isUpdating = false;
    await setConfigItem('lastCheckTime', new Date().toISOString());
    setTimeout(() => app.quit(), 500);
    onComplete && onComplete(true, null);

  } catch (err) {
    const rawErr = err instanceof Error ? err.message : String(err);
    console.error('[Updater] Update process error:', err);
    if (zipPath) await fs.remove(zipPath).catch(() => {});
    if (tempDir) await releaseTempDir(tempDir, isManualDir);
    updaterStateInternal.isUpdating = false;
    const friendly = formatFriendlyUpdateError(rawErr, null, 'check');
    onComplete && onComplete(false, rawErr, friendly);
  }
}
