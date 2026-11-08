// Updater dialog: system dialog fallback [更新器弹窗 - 系统弹窗兜底]

import { dialog } from 'electron';
import type { DialogResponse } from 'sparklet/shared/types/updater/updater.js';
import type { DialogParams } from 'sparklet/main/updater/dialog/dialog-types.js';

/**
 * System dialog fallback (only used when no window found or renderer doesn't respond, hardcodes English to avoid garbled text) Normally doesn't trigger, this is just basic fallback, no i18n guarantee [系统 dialog 兜底 (找不到窗口或渲染层不响应时才用，硬编码英文避免乱码) 一般情况下不触发，这里只做最基本保底，不保证 i18n]
 */
export function systemDialogFallback(dialogType: string, params: DialogParams): Promise<DialogResponse> {
  const title = `Sparklet Update - ${dialogType}`;
  const detail = Object.entries(params || {})
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
    .join('\n');

  if (dialogType === 'rollback-no-cache' || dialogType === 'rollback-with-cache' || dialogType === 'manual-update-failed' || dialogType === 'simple-error') {
    return dialog.showMessageBox({
      type: 'error', title, message: title, detail,
      buttons: ['OK'], defaultId: 0
    }).then(r => ({ buttonIndex: r.response }));
  }

  return dialog.showMessageBox({
    type: 'info', title, message: title, detail,
    buttons: ['OK'], defaultId: 0
  }).then(r => ({ buttonIndex: r.response }));
}
