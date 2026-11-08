// Custom confirm dialog: DOM lookup + fill [自定义确认弹窗 - DOM 查找与填充]

import { t } from '../../i18n/i18n.js';
import type { ConfirmElements, ConfirmOptions } from './custom-dialog-types.js';

/** Resolve the confirm modal elements, or null when any is missing [解析确认弹窗元素，缺任一则返回 null] */
export function resolveConfirmElements(): ConfirmElements | null {
  const modal = document.getElementById('customConfirmModal');
  const titleEl = document.getElementById('confirmTitle');
  const msgEl = document.getElementById('confirmMessage');
  const okBtn = document.getElementById('confirmOkBtn');
  const cancelBtn = document.getElementById('confirmCancelBtn');

  if (!modal || !titleEl || !msgEl || !okBtn || !cancelBtn) return null;

  return {
    modal: modal as HTMLElement,
    titleEl,
    msgEl,
    okBtn: okBtn as HTMLButtonElement,
    cancelBtn: cancelBtn as HTMLButtonElement,
  };
}

/** Fill the modal with the resolved options and show it [用解析后的选项填充弹窗并显示] */
export function fillConfirmElements(el: ConfirmElements, options: ConfirmOptions): void {
  const {
    title = t('confirm.default.title'),
    message = t('confirm.default.message'),
    okText = t('confirm.default.ok'),
    cancelText = t('confirm.default.cancel'),
    okDanger = false
  } = options;

  el.titleEl.textContent = title;
  el.msgEl.textContent = message;
  el.okBtn.textContent = okText;
  el.cancelBtn.textContent = cancelText;
  el.okBtn.style.background = okDanger ? '#ef4444' : '';

  el.modal.style.display = 'flex';
}
