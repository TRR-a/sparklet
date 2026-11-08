// Updater dialog: response sender [更新器弹窗 - 响应回传]

import { updaterApi } from 'sparklet/renderer/shared/index.js';

/**
 * Build the responder that hides the modal and sends the choice to main
 * [构造响应器：隐藏弹窗并把选择回传主进程]
 * @param modalEl Modal root element [弹窗根元素]
 * @param dialogId Unique dialog ID from main process [主进程传的唯一 dialogId]
 */
export function makeDialogResponder(
  modalEl: HTMLElement,
  dialogId: string
): (buttonIndex: number, extra?: Record<string, unknown>) => Promise<void> {
  return async (buttonIndex: number, extra: Record<string, unknown> = {}): Promise<void> => {
    modalEl.style.display = 'none';
    if (window.sparklet) {
      try {
        await updaterApi.sendDialogResponse(dialogId, { buttonIndex, ...extra });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('sendUpdateDialogResponse failed:', msg);
      }
    }
  };
}
