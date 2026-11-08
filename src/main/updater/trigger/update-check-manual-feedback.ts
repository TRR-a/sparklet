// Update check: manual failure feedback [更新检查 - 手动失败反馈]

import { BrowserWindow } from 'electron';
import { broadcastToast, promptRendererDialog } from '../dialog/dialog.js';

/** Push the failure status, toast the reason, and fall back to a dialog when no window [推送失败状态与 toast，无窗口时回退弹窗] */
export function notifyManualFailure(
  win: BrowserWindow | null,
  error: string,
  friendlyError: string | null
): void {
  if (win) {
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
    return;
  }

  console.error('[Updater] Manual update failed:', error);
  promptRendererDialog('manual-update-failed', {
    error: friendlyError || error || 'Unknown error'
  });
}
