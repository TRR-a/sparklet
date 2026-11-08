// Custom confirm dialog - replaces native window.confirm() for consistent UI [自定义确认弹窗 - 替换系统原生 window.confirm() 以保持 UI 一致]
// Uses #customConfirmModal element from HTML [使用 HTML 中的 #customConfirmModal 元素]
//
// Split out [已拆分]：options/element types → custom-dialog-types.ts,
// DOM lookup + fill → custom-dialog-dom.ts.

import type { ConfirmOptions } from 'sparklet/renderer/shared/ui/dialog/custom-dialog-types.js';
import { fillConfirmElements, resolveConfirmElements } from 'sparklet/renderer/shared/ui/dialog/custom-dialog-dom.js';

export type { ConfirmOptions } from 'sparklet/renderer/shared/ui/dialog/custom-dialog-types.js';

/**
 * Show custom confirm dialog, returns Promise<boolean>: true=OK, false=Cancel [弹出自定义确认框，返回 Promise<boolean>：true=确定，false=取消]
 */
export function showCustomConfirm(options: ConfirmOptions = {}): Promise<boolean> {
  return new Promise((resolve: (result: boolean) => void) => {
    const el = resolveConfirmElements();
    if (!el) {
      resolve(false);
      return;
    }

    fillConfirmElements(el, options);

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
      el.modal.style.display = 'none';
      el.okBtn.onclick = null;
      el.cancelBtn.onclick = null;
      resolve(result);
    };

    el.okBtn.onclick = (): void => finish(true);
    el.cancelBtn.onclick = (): void => finish(false);
    document.addEventListener('keydown', escHandler);
  });
}
