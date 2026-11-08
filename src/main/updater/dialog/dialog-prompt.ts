// Renderer dialog prompting & system fallback [渲染层弹窗调用与系统兜底]
//
// Split out [已拆分]：window lookup → dialog-window-find.ts,
// system fallback → dialog-system-fallback.ts, send/timeout → dialog-prompt-send.ts.

import type { DialogPayload, DialogResponse } from 'sparklet/shared/types/updater/updater.js';
import type { DialogParams, DialogOptions } from 'sparklet/main/updater/dialog/dialog-types.js';
import { nextDialogId } from 'sparklet/main/updater/dialog/dialog-response.js';
import { findAvailableWindow } from 'sparklet/main/updater/dialog/dialog-window-find.js';
import { systemDialogFallback } from 'sparklet/main/updater/dialog/dialog-system-fallback.js';
import { sendRendererDialog } from 'sparklet/main/updater/dialog/dialog-prompt-send.js';

export { findAvailableWindow } from 'sparklet/main/updater/dialog/dialog-window-find.js';

/**
 * Show custom UI dialog via renderer (i18n friendly, unified style) [通过渲染层弹自定义 UI 对话框 (i18n 友好，统一风格)]
 * @param dialogType Dialog type: update-confirm / notify-only / restart-confirm / rollback-with-cache / rollback-restart / rollback-no-cache / manual-update-failed / simple-error / temp-dir-error / temp-dir-not-empty [弹窗类型]
 * @param params Params passed to renderer for display (version / codename / errors etc.) [传给渲染层用于显示的参数 (version / codename / errors 等)]
 * @param options Dialog options [弹窗选项]
 * @returns User's selection result (usually { buttonIndex: number }) [用户选择的结果 (通常是 { buttonIndex: number })]
 */
export async function promptRendererDialog(
  dialogType: string,
  params: DialogParams = {},
  options: DialogOptions = {}
): Promise<DialogResponse> {
  const {
    timeoutMs = 0,
    fallbackResponse = { buttonIndex: 1 },
    fallbackToSystemDialog = true
  } = options;

  const win = findAvailableWindow();

  // No available window: fall back to system dialog [没有可用窗口：走系统 dialog 兜底]
  if (!win) {
    if (!fallbackToSystemDialog) return fallbackResponse;
    console.warn('[Updater] No renderer window available, falling back to system dialog for type=' + dialogType);
    return systemDialogFallback(dialogType, params);
  }

  const dialogId = nextDialogId();
  const payload: DialogPayload = { dialogId, dialogType, params, timeoutMs };
  return sendRendererDialog(win, dialogId, payload, timeoutMs, fallbackResponse);
}
