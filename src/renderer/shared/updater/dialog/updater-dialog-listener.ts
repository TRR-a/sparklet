// Updater dialog: IPC listener [更新器弹窗 - IPC 监听]

import { updaterApi } from 'sparklet/renderer/shared/index.js';
import type { UpdaterDialogParams } from './updater-dialog-types.js';
import { showUpdaterDialog } from './updater-dialog-show.js';

/**
 * Bind updater dialog listener (receives dialog show events from main process) [绑定更新器弹窗监听 (接收来自主进程的弹窗显示事件)]
 */
export function bindUpdaterDialogListener(): void {
  if (!window.sparklet) return;
  updaterApi.onDialogShow((payload) => {
    const p = payload as unknown as UpdaterDialogParams;
    console.log('[Settings] Received updater dialog show:', p.dialogType);
    showUpdaterDialog(p.dialogId, p.dialogType, p.params || {}, p.timeoutMs || 0);
  });
}
