// Exit confirm dialog: event binding [退出确认弹窗 - 事件绑定]

import { getModal, getQuitBtn, getReturnBtn } from 'sparklet/renderer/app/popup/modals/exit/scripts/exit-dialog-focus.js';
import { closeDialog, performQuit } from 'sparklet/renderer/app/popup/modals/exit/scripts/exit-dialog-actions.js';
import { onExitDialogKeyDown } from 'sparklet/renderer/app/popup/modals/exit/scripts/exit-dialog-keydown.js';

/**
 * Bind exit-confirm dialog events (call once on init) [绑定退出确认弹窗事件 (初始化时调用一次)]
 */
export function initExitDialog(): void {
  document.addEventListener('keydown', onExitDialogKeyDown, true);

  const returnBtn = getReturnBtn();
  const quitBtn = getQuitBtn();
  if (returnBtn) returnBtn.addEventListener('click', closeDialog);
  if (quitBtn) quitBtn.addEventListener('click', () => void performQuit());

  // Overlay background click does NOT close: fixed-center design requires explicit choice [点击遮罩不关闭：固定居中设计要求显式选择]
  const modal = getModal();
  if (modal) {
    modal.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target === modal) e.preventDefault(); // swallow, no close [吞掉事件，不关闭]
    });
  }
}
