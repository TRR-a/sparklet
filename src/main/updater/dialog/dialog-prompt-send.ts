// Renderer dialog: send + timeout wrapper [渲染层弹窗 - 发送与超时包装]

import type { BrowserWindow } from 'electron';
import type { DialogPayload, DialogResponse } from 'sparklet/shared/types/updater/updater.js';
import { pendingDialogResponses } from 'sparklet/main/updater/dialog/dialog-response.js';

/** Send the dialog payload and resolve with the user's response (or fallback on timeout) [发送弹窗负载并以用户响应 (或超时兜底) 收尾] */
export function sendRendererDialog(
  win: BrowserWindow,
  dialogId: string,
  payload: DialogPayload,
  timeoutMs: number,
  fallbackResponse: DialogResponse
): Promise<DialogResponse> {
  return new Promise<DialogResponse>((resolve) => {
    let timer: NodeJS.Timeout | null = null;
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        if (pendingDialogResponses.has(dialogId)) {
          console.log('[Updater] Dialog timeout, returning fallback:', payload.dialogType);
          pendingDialogResponses.delete(dialogId);
          resolve(fallbackResponse);
        }
      }, timeoutMs);
    }

    pendingDialogResponses.set(dialogId, { resolve, timer });
    console.log(`[Updater] Sending renderer dialog: ${payload.dialogType} id=${dialogId}`);
    win.webContents.send('updater:dialog-show', payload);
  });
}
