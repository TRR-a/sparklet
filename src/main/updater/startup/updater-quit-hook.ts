// Updater: quit hook for pending updates [更新器 - 退出时处理待安装更新]

import { app } from 'electron';
import { updaterStateInternal } from './update-state.js';
import { checkPendingUpdate } from './update-timer.js';

/** Bind the before-quit hook that installs a pending update [绑定退出前安装待处理更新的钩子] */
export function bindQuitHook(): void {
  app.on('before-quit', async (event) => {
    if (updaterStateInternal.pendingUpdate) {
      event.preventDefault();
      await checkPendingUpdate();
    }
  });
}
