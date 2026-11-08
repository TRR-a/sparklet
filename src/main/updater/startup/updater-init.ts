// Updater initialization [更新器初始化]
//
// Split out [已拆分]：dev override → updater-dev-override.ts,
// startup background tasks → updater-startup-tasks.ts,
// quit hook → updater-quit-hook.ts.

import { app } from 'electron';
import { readConfig, broadcastConfigChange } from '../config/config-manager.js';
import { ensureDialogResponseHandler, broadcastToast } from '../dialog/dialog.js';
import { updaterStateInternal } from './update-state.js';
import { startConfigWatcher } from '../config/config-manager.js';
import { startUpdateTimer } from './update-timer.js';
import { checkDisableFlags } from './updater-disable-flags.js';
import { applyDevConfigOverride } from './updater-dev-override.js';
import {
  scheduleStartupCacheCleanup,
  scheduleStartupFileIntegrityCheck,
  runStartupSelfCheck,
} from './updater-startup-tasks.js';
import { bindQuitHook } from './updater-quit-hook.js';

export { applyDevConfigOverride } from './updater-dev-override.js';

/**
 * Initialize updater module [初始化更新模块]
 */
export function initUpdater(): void {
  checkDisableFlags();

  // Register renderer custom dialog response handler (register once only) [注册渲染层自定义弹窗响应 handler (仅注册一次)]
  ensureDialogResponseHandler();

  startConfigWatcher();

  scheduleStartupCacheCleanup();
  scheduleStartupFileIntegrityCheck();
  runStartupSelfCheck();

  if (updaterStateInternal.pendingUpdate) {
    console.log('[Updater] Pending update found, will install on app exit');
  }

  bindQuitHook();

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
