// Custom confirm dialog - replaces native window.confirm() for consistent UI [自定义确认弹窗 - 替换系统原生 window.confirm() 以保持 UI 一致]
// Uses #customConfirmModal element from HTML [使用 HTML 中的 #customConfirmModal 元素]

import { t } from './i18n.js';

/** Custom confirm dialog options [自定义确认弹窗选项] */
export interface ConfirmOptions {
  title?: string;
  message?: string;
  okText?: string;
  cancelText?: string;
  okDanger?: boolean;
}

/**
 * Show custom confirm dialog, returns Promise<boolean>: true=OK, false=Cancel [弹出自定义确认框，返回 Promise<boolean>：true=确定，false=取消]
 */
export function showCustomConfirm(options: ConfirmOptions = {}): Promise<boolean> {
  const {
    title = t('confirm.default.title'),
    message = t('confirm.default.message'),
    okText = t('confirm.default.ok'),
    cancelText = t('confirm.default.cancel'),
    okDanger = false
  } = options;

  return new Promise((resolve: (result: boolean) => void) => {
    const modal = document.getElementById('customConfirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');

    if (!modal || !titleEl || !msgEl || !okBtn || !cancelBtn) {
      resolve(false);
      return;
    }

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = okText;
    cancelBtn.textContent = cancelText;
    okBtn.style.background = okDanger ? '#ef4444' : '';

    (modal as HTMLElement).style.display = 'flex';

    let settled = false;

    // ESC key cancel handler (defined before finish so it can be removed inside finish) [ESC 键取消 handler (定义在 finish 之前，供 finish 内部移除)]
    const escHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') finish(false);
    };

    const finish = (result: boolean): void => {
      if (settled) return;
      settled = true;
      // Remove ESC listener on any finish path (OK/Cancel/ESC) to avoid memory leaks [任何 finish 路径 (确定/取消/ESC) 都移除 ESC 监听，避免内存泄漏]
      document.removeEventListener('keydown', escHandler);
      (modal as HTMLElement).style.display = 'none';
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      resolve(result);
    };

    okBtn.onclick = (): void => finish(true);
    cancelBtn.onclick = (): void => finish(false);
    document.addEventListener('keydown', escHandler);
  });
}
