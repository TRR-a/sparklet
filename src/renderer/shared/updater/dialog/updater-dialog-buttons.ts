// Updater dialog: button row rendering [更新器弹窗 - 按钮行渲染]

import type { DialogButton } from 'sparklet/renderer/shared/updater/dialog/updater-dialog-types.js';

/**
 * Render the dialog button row [渲染弹窗按钮行]
 * @param buttonsEl Container element [按钮容器]
 * @param buttons Button definitions [按钮定义]
 * @param onResponse Response callback after a click [点击后的响应回调]
 */
export function renderDialogButtons(
  buttonsEl: HTMLElement,
  buttons: DialogButton[],
  onResponse: (index: number) => void
): void {
  buttonsEl.innerHTML = '';
  buttons.sort((a, b) => a.index - b.index).forEach((btn: DialogButton) => {
    const b = document.createElement('button');
    b.className = 'custom-confirm-btn ' + (btn.style || 'default');
    b.textContent = btn.label;
    b.addEventListener('click', () => {
      if (typeof btn.onClick === 'function') {
        try { btn.onClick(); } catch { /* ignore [忽略] */ }
      }
      onResponse(btn.index);
    });
    buttonsEl.appendChild(b);
  });
}
