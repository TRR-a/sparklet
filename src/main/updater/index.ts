// Update module entry point [更新模块入口]

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs-extra';
import {
  DISABLE_UPDATE_FLAGS,
  MAX_RETRY_COUNT
} from './constants';
import { acquireTempDir, releaseTempDir } from './temp-manager';
import { checkForUpdates, getCurrentVersion } from './check';
import { downloadWithRetry } from './download';
import {
  verifyReleaseManifest,
  verifyPackageIntegrity,
  selfCheckIntegrity,
  verifyInstalledFiles
} from './verify';
import { installUpdate } from './installer';
import {
  readConfig,
  writeConfig,
  getConfigItem,
  setConfigItem,
  getCheckInterval,
  getUpdateBehavior,
  startConfigWatcher,
  broadcastConfigChange
} from './config-manager';
import * as cacheManager from './cache-manager';
import {
  promptRendererDialog,
  ensureDialogResponseHandler,
  showUpdateDialog,
  showNotifyOnlyDialog,
  showRestartDialog,
  broadcastToast,
  formatFriendlyUpdateError
} from './dialog';
import type { ProgressCallback, CompleteCallback } from './dialog';
import { handleIntegrityRollback } from './rollback';
import type { PendingUpdateInfo } from './rollback';
import type { CheckResult, NetworkErrorType } from '../../shared/types/updater';

// Update state [更新状态]
let isUpdating = false;
let pendingUpdate: PendingUpdateInfo | null = null;
let updateDisabled = false;
let checkTimer: NodeJS.Timeout | null = null;
let isChecking = false;

function checkDisableFlags(): boolean {
  const args = process.argv;
  updateDisabled = DISABLE_UPDATE_FLAGS.some(flag => args.includes(flag));
  if (updateDisabled) {
    console.log('[Updater] Update disabled via command line flag');
  }
  return updateDisabled;
}

/**
 * Execute the complete update flow [执行完整的更新流程]
 */
async function performUpdate(onProgress: ProgressCallback | null, onComplete: CompleteCallback | null): Promise<void> {
  if (isUpdating) {
    console.warn('[Updater] Update already in progress');
    onComplete && onComplete(false, 'Update already in progress');
    return;
  }
  isUpdating = true;
  let tempDir: string | null = null;
  let isManualDir = false;
  let zipPath: string | null = null;

  try {
    if (updateDisabled) {
      console.log('[Updater] Update disabled, skipping');
      onComplete && onComplete(false, 'Update disabled');
      isUpdating = false;
      return;
    }

    const updateBehavior = await getUpdateBehavior();
    if (updateBehavior === 'disabled') {
      console.log('[Updater] User disabled updates');
      onComplete && onComplete(true, null);
      isUpdating = false;
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
      isUpdating = false;
      return;
    }
    if (!checkResult.hasUpdate) {
      console.log('[Updater] Already up to date');
      onComplete && onComplete(true, null);
      isUpdating = false;
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
      isUpdating = false;
      return;
    }

    onProgress && onProgress('Fetching update metadata...', 3);
    const manifestResult = await verifyReleaseManifest(manifestUrl!, `v${latestVersion}`);
    if (!manifestResult.success) {
      const friendly = formatFriendlyUpdateError(
        manifestResult.error, null, 'download-manifest'
      );
      onComplete && onComplete(false, manifestResult.error, friendly);
      isUpdating = false;
      return;
    }
    const entry = manifestResult.entry!;

    const confirmResult = await showUpdateDialog(currentVersion, entry);
    const userConfirmed = confirmResult.buttonIndex === 0;
    if (!userConfirmed) {
      console.log('[Updater] User cancelled update');
      onComplete && onComplete(true, null);
      isUpdating = false;
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
      isUpdating = false;
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
      isUpdating = false;
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
      isUpdating = false;
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
      pendingUpdate = { zipPath: zipPath!, tempDir: tempDir!, isManualDir, targetVersion: latestVersion! };
      console.log('[Updater] User chose later, update will be applied on app exit' + (timeoutOccurred ? ' (timeout triggered)' : ''));
      await setConfigItem('lastCheckTime', new Date().toISOString());
      onComplete && onComplete(true, null);
      isUpdating = false;
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
      isUpdating = false;
      return;
    }

    onProgress && onProgress('Update complete, restarting...', 100);
    pendingUpdate = null;
    isUpdating = false;
    await setConfigItem('lastCheckTime', new Date().toISOString());
    setTimeout(() => app.quit(), 500);
    onComplete && onComplete(true, null);

  } catch (err) {
    const rawErr = err instanceof Error ? err.message : String(err);
    console.error('[Updater] Update process error:', err);
    if (zipPath) await fs.remove(zipPath).catch(() => {});
    if (tempDir) await releaseTempDir(tempDir, isManualDir);
    isUpdating = false;
    const friendly = formatFriendlyUpdateError(rawErr, null, 'check');
    onComplete && onComplete(false, rawErr, friendly);
  }
}

async function checkPendingUpdate(): Promise<boolean> {
  if (!pendingUpdate) return false;
  console.log('[Updater] Pending update detected, applying...');
  const { zipPath, tempDir, isManualDir, targetVersion } = pendingUpdate;
  const result = await installUpdate(zipPath, tempDir, targetVersion);
  if (result.success) {
    pendingUpdate = null;
    setTimeout(() => app.quit(), 500);
    return true;
  } else {
    console.error('[Updater] Pending update failed:', result.error);
    await releaseTempDir(tempDir, isManualDir);
    pendingUpdate = null;
    return false;
  }
}

/**
 * Auto check for updates (triggered by timer) [自动检查更新 (由定时器触发)]
 */
async function autoCheckUpdate(): Promise<void> {
  if (!app.isPackaged) {
    console.log('[Updater] Development environment, auto-update disabled');
    return;
  }

  if (isChecking || isUpdating) return;
  if (updateDisabled) return;

  const updateBehavior = await getUpdateBehavior();
  if (updateBehavior === 'disabled') return;

  isChecking = true;
  console.log('[Updater] Auto-checking for updates...');
  await performUpdate(
    (msg, percent) => console.log(`[Updater] Auto-progress: ${msg} (${percent}%)`),
    (success, error) => {
      if (!success && error) {
        console.warn('[Updater] Auto-check failed:', error);
      }
      isChecking = false;
    }
  );
  isChecking = false;
}

/**
 * Start the update timer [启动定时器]
 */
function startUpdateTimer(): void {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }

  getCheckInterval().then(interval => {
    if (interval === 0) {
      console.log('[Updater] Timer: check on startup only');
      setTimeout(autoCheckUpdate, 5000);
      return;
    }

    console.log('[Updater] Timer started, interval:', interval, 'ms');
    setTimeout(() => {
      autoCheckUpdate();
      checkTimer = setInterval(autoCheckUpdate, interval);
    }, 5000);
  }).catch(err => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Updater] Failed to start timer:', msg);
  });
}

/**
 * Manually trigger update check (user clicks "check now") [手动触发更新检查 (用户点击「立即检查」)]
 */
function checkUpdateManually(): void {
  if (!app.isPackaged) {
    console.log('[Updater] Development environment, manual update disabled');
    broadcastToast({ key: 'updater.toast.devEnvDisabled' }, 'info', 10000);
    return;
  }

  if (updateDisabled) {
    console.log('[Updater] Update disabled, cannot check manually');
    broadcastToast({ key: 'updater.toast.disabledByCli' }, 'warning', 3000);
    return;
  }

  if (isChecking || isUpdating) {
    broadcastToast({ key: 'updater.toast.checking' }, 'info', 3000);
    return;
  }

  isChecking = true;
  console.log('[Updater] Manual check triggered');

  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.send('updater:status-change', { checking: true });
  }

  performUpdate(
    (msg, percent) => {
      console.log(`[Updater] Manual progress: ${msg} (${percent}%)`);
      if (win) {
        win.webContents.send('updater:progress', { msg, percent });
      }
    },
    (success, error, friendlyError) => {
      isChecking = false;
      if (win) {
        win.webContents.send('updater:status-change', { checking: false });
        if (success) {
          win.webContents.send('updater:status-change', { done: true });
        } else if (error) {
          win.webContents.send('updater:status-change', { error });
          if (friendlyError) {
            // Friendly error is usually pre-assembled Chinese in main process, pass i18n key to renderer [友好错误一般是主进程拼好的中文，交给渲染层时传 i18n key]
            broadcastToast(
              { key: 'updater.toast.updateFailedWithReason', params: { reason: friendlyError } },
              'error',
              8000
            );
          } else {
            broadcastToast({ key: 'updater.toast.updateFailedGeneric' }, 'error', 6000);
          }
        }
      }
      if (success) {
        console.log('[Updater] Manual update completed');
      } else if (error) {
        console.error('[Updater] Manual update failed:', error);
        if (!win) {
          promptRendererDialog('manual-update-failed', {
            error: friendlyError || error || 'Unknown error'
          });
        }
      }
    }
  );
}

/**
 * Force config override in development environment [开发环境强制覆盖配置]
 */
async function applyDevConfigOverride(): Promise<void> {
  if (app.isPackaged) return;

  console.log('[Updater] Development mode: applying config override');

  const config = await readConfig();
  const changed: string[] = [];

  if (config.updateBehavior !== 'disabled') {
    config.updateBehavior = 'disabled';
    changed.push('updateBehavior');
  }
  if (config.checkInterval !== 1800000) {
    config.checkInterval = 1800000;
    changed.push('checkInterval');
  }

  if (changed.length > 0) {
    await writeConfig(config);
    console.log('[Updater] Dev config override applied:', changed.join(', '));
    broadcastConfigChange(config);
  }
}

function initUpdater(): void {
  checkDisableFlags();

  // Register renderer custom dialog response handler (register once only) [注册渲染层自定义弹窗响应 handler (仅注册一次)]
  ensureDialogResponseHandler();

  startConfigWatcher();

  // ========== On startup: clean expired cache ========== [启动时：清理过期缓存]
  setTimeout(async () => {
    try {
      let retentionDays: number | null = null;
      try {
        retentionDays = await getConfigItem('cacheRetentionDays') as number | null;
      } catch { /* ignore [忽略] */ }
      await cacheManager.cleanupExpired(retentionDays);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Updater] Cache cleanup failed (non-critical):', msg);
    }
  }, 1500);

  // ========== On startup: file integrity check (failure triggers rollback) ========== [启动时文件完整性校验 (失败则走回滚流程)]
  setTimeout(async () => {
    try {
      const currentVersion = getCurrentVersion();
      const result = await verifyInstalledFiles(currentVersion, (msg, pct) => {
        console.log(`[Verify] ${msg} (${pct}%)`);
      });
      if (!result.success) {
        console.warn('[Verify] Integrity check failed:', result.errors);
        // Switch to rollback flow (use cache if available, otherwise prompt to download from official) [改为走回滚流程 (有缓存用缓存，没缓存提示官网下载)]
        await handleIntegrityRollback(currentVersion, result.errors, {
          setPendingUpdate: (u) => { pendingUpdate = u; }
        });
      }
    } catch (err) {
      console.error('[Verify] Integrity check error:', err);
    }
  }, 3000);
  // ========== End of startup file integrity check ========== [启动时文件完整性校验结束]

  selfCheckIntegrity().then(async (result) => {
    if (!result.success) {
      console.warn('[Updater] Integrity self-check warning:', result.error);
      // exe corrupted/tampered: also go through rollback (reinstall from cache if intact, otherwise prompt official download) [exe 损坏/篡改：同样走回滚流程 (缓存完好则重装，否则提示官网下载)]
      try {
        const version = getCurrentVersion();
        await handleIntegrityRollback(version, [result.error || '可执行文件完整性校验失败'], {
          setPendingUpdate: (u) => { pendingUpdate = u; }
        });
      } catch (err) {
        console.error('[Updater] Self-check rollback failed:', err);
      }
    }
  });

  if (pendingUpdate) {
    console.log('[Updater] Pending update found, will install on app exit');
  }

  app.on('before-quit', async (event) => {
    if (pendingUpdate) {
      event.preventDefault();
      await checkPendingUpdate();
    }
  });

  startUpdateTimer();

  if (!app.isPackaged) {
    console.log('[Updater] Development environment detected');
    setTimeout(async () => {
      await applyDevConfigOverride();
      broadcastToast({ key: 'updater.toast.devEnvAutoDisabled' }, 'info', 10000);
      const config = await readConfig();
      broadcastConfigChange(config);
    }, 2000);
  }

  console.log('[Updater] Update module initialized');
}

export {
  initUpdater,
  checkUpdateManually,
  checkPendingUpdate,
  performUpdate,
  broadcastToast,
  applyDevConfigOverride,
  checkDisableFlags
};

export const updaterState = {
  get isUpdating() { return isUpdating; },
  get pendingUpdate() { return pendingUpdate; },
  get updateDisabled() { return updateDisabled; },
  get isChecking() { return isChecking; }
};
