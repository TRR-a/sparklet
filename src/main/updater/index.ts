// Update module entry point [更新模块入口]

import { app } from 'electron';
import { DISABLE_UPDATE_FLAGS } from './constants';
import {
  readConfig,
  writeConfig,
  getConfigItem,
  startConfigWatcher,
  broadcastConfigChange,
} from './config-manager';
import * as cacheManager from './cache-manager';
import { ensureDialogResponseHandler, broadcastToast } from './dialog';
import {
  selfCheckIntegrity,
  verifyInstalledFiles,
} from './verify-integrity';
import { getCurrentVersion } from './check';
import { handleIntegrityRollback } from './rollback';
import { updaterStateInternal } from './update-state';
import { performUpdate } from './update-flow';
import {
  checkPendingUpdate,
  autoCheckUpdate,
  startUpdateTimer,
  checkUpdateManually,
} from './update-timer';

function checkDisableFlags(): boolean {
  const args = process.argv;
  updaterStateInternal.updateDisabled = DISABLE_UPDATE_FLAGS.some(flag => args.includes(flag));
  if (updaterStateInternal.updateDisabled) {
    console.log('[Updater] Update disabled via command line flag');
  }
  return updaterStateInternal.updateDisabled;
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
          setPendingUpdate: (u) => { updaterStateInternal.pendingUpdate = u; }
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
          setPendingUpdate: (u) => { updaterStateInternal.pendingUpdate = u; }
        });
      } catch (err) {
        console.error('[Updater] Self-check rollback failed:', err);
      }
    }
  });

  if (updaterStateInternal.pendingUpdate) {
    console.log('[Updater] Pending update found, will install on app exit');
  }

  app.on('before-quit', async (event) => {
    if (updaterStateInternal.pendingUpdate) {
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
  applyDevConfigOverride,
  checkDisableFlags,
  autoCheckUpdate,
};

export const updaterState = {
  get isUpdating() { return updaterStateInternal.isUpdating; },
  get pendingUpdate() { return updaterStateInternal.pendingUpdate; },
  get updateDisabled() { return updaterStateInternal.updateDisabled; },
  get isChecking() { return updaterStateInternal.isChecking; }
};
