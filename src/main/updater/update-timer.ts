// Update timer - auto check, manual check, pending update [更新定时器 - 自动检查、手动检查、待处理更新]

import { app, BrowserWindow } from 'electron';
import { installUpdate } from './installer';
import { releaseTempDir } from './temp-manager';
import { getUpdateBehavior, getCheckInterval } from './config-manager';
import { broadcastToast, promptRendererDialog } from './dialog';
import { updaterStateInternal } from './update-state';
import { performUpdate } from './update-flow';

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

/**
 * Manually trigger update check (user clicks "check now") [手动触发更新检查 (用户点击「立即检查」)]
 */
export function checkUpdateManually(): void {
  if (!app.isPackaged) {
    console.log('[Updater] Development environment, manual update disabled');
    broadcastToast({ key: 'updater.toast.devEnvDisabled' }, 'info', 10000);
    return;
  }

  if (updaterStateInternal.updateDisabled) {
    console.log('[Updater] Update disabled, cannot check manually');
    broadcastToast({ key: 'updater.toast.disabledByCli' }, 'warning', 3000);
    return;
  }

  if (updaterStateInternal.isChecking || updaterStateInternal.isUpdating) {
    broadcastToast({ key: 'updater.toast.checking' }, 'info', 3000);
    return;
  }

  updaterStateInternal.isChecking = true;
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
      updaterStateInternal.isChecking = false;
      if (win) {
        win.webContents.send('updater:status-change', { checking: false });
        if (success) {
          win.webContents.send('updater:status-change', { done: true });
        } else if (error) {
          win.webContents.send('updater:status-change', { error });
          if (friendlyError) {
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
