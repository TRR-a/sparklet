// Updater dialog: restart countdown ticker [更新器弹窗 - 重启倒计时]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';

/**
 * Start the 30s restart countdown inside the dialog [启动弹窗内 30s 重启倒计时]
 * @param timeoutMs Timeout in ms [超时毫秒]
 */
export function startRestartCountdown(timeoutMs: number): void {
  if (timeoutMs <= 0) return;
  let remaining = Math.round(timeoutMs / 1000);
  const timerId = setInterval((): void => {
    remaining -= 1;
    const cdEl = document.getElementById('restartCountdown');
    if (cdEl) {
      cdEl.textContent = t('dialog.restartConfirm.countdown', { seconds: String(remaining) });
    }
    if (remaining <= 0) {
      clearInterval(timerId);
    }
    const modalCheck = document.getElementById('updaterDialogModal');
    if (!modalCheck || modalCheck.style.display === 'none') {
      clearInterval(timerId);
    }
  }, 1000);
  const cdEl = document.getElementById('restartCountdown');
  if (cdEl) cdEl.textContent = t('dialog.restartConfirm.countdown', { seconds: String(remaining) });
}
