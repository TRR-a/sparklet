// Dialog response handler & pending registry [弹窗响应处理器与待处理登记]

import { ipcMain } from 'electron';
import type { DialogResponse } from 'sparklet/shared/types/updater';

/** Dialog response pending entry [弹窗响应待处理条目] */
interface PendingDialogEntry {
  resolve: (response: DialogResponse) => void;
  timer: NodeJS.Timeout | null;
}

/**
 * Map<dialogId, { resolve, timer, fallback }> Renderer responds to user action via ipcMain.handle('updater:dialog-response') [Map<dialogId, { resolve, timer, fallback }> 渲染层响应用户操作后通过 ipcMain.handle('updater:dialog-response') 回传]
 */
export const pendingDialogResponses = new Map<string, PendingDialogEntry>();
let dialogIdSeq = 0;

/** Allocate the next dialog id [分配下一个弹窗 ID] */
export function nextDialogId(): string {
  return `dlg_${Date.now()}_${(++dialogIdSeq)}`;
}

/**
 * Renderer response handler: updater:dialog-response Register once during initUpdater (prevent duplicate registration) [渲染层回传响应：updater:dialog-response 在 initUpdater 时注册一次 handle (防止重复注册)]
 */
let dialogResponseHandlerRegistered = false;
export function ensureDialogResponseHandler(): void {
  if (dialogResponseHandlerRegistered) return;
  dialogResponseHandlerRegistered = true;

  ipcMain.handle('updater:dialog-response', (_event, { dialogId, response }: { dialogId: string; response: DialogResponse }) => {
    const entry = pendingDialogResponses.get(dialogId);
    if (!entry) {
      console.warn('[Updater] Received dialog-response for unknown/expired id:', dialogId);
      return { ok: false, reason: 'unknown-dialog-id' };
    }
    pendingDialogResponses.delete(dialogId);
    if (entry.timer) clearTimeout(entry.timer);
    console.log(`[Updater] Dialog response received: id=${dialogId}, response=`, response);
    entry.resolve(response);
    return { ok: true };
  });
}
