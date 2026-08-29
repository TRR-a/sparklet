// Updater custom dialog - replaces native system dialog for update notifications [更新器自定义弹窗 - 替换系统原生弹窗用于更新通知]
// DOM rendering and event binding; content builders moved to updater-dialog-content.ts [DOM 渲染和事件绑定；内容构建器已移至 updater-dialog-content.ts]

import { buildDialogContent, openExternal } from './updater-dialog-content.js';
import type { DialogButton } from './updater-dialog-content.js';
import { updaterApi } from '../../../src/renderer/core/index.js';

/** Updater dialog params from main process [来自主进程的更新器弹窗参数] */
export interface UpdaterDialogParams {
  dialogId: string;
  dialogType: string;
  params: Record<string, unknown>;
  timeoutMs: number;
}

/**
 * Show updater dialog based on type, user response sent back via IPC [根据类型显示更新器弹窗，用户响应通过 IPC 回传]
 * @param dialogId Unique dialog ID from main process [主进程传的唯一 dialogId]
 * @param dialogType Dialog type [弹窗类型]
 * @param params Params for display (version / errors etc.) [显示参数]
 * @param timeoutMs Timeout in ms (0=no timeout) [超时毫秒 (0=无超时)]
 */
export function showUpdaterDialog(
  dialogId: string,
  dialogType: string,
  params: Record<string, unknown>,
  timeoutMs: number = 0
): void {
  const modalEl = document.getElementById('updaterDialogModal');
  const titleEl = document.getElementById('updaterDialogTitle');
  const bodyEl = document.getElementById('updaterDialogBody');
  const buttonsEl = document.getElementById('updaterDialogButtons');
  if (!modalEl || !titleEl || !bodyEl || !buttonsEl) return;

  /** Send user response back to main process [将用户响应回传给主进程] */
  const sendResponse = async (buttonIndex: number, extra: Record<string, unknown> = {}): Promise<void> => {
    (modalEl as HTMLElement).style.display = 'none';
    if (window.sparklet) {
      try {
        await updaterApi.sendDialogResponse(dialogId, { buttonIndex, ...extra });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('sendUpdateDialogResponse failed:', msg);
      }
    }
  };

  const { title, bodyHtml, buttons } = buildDialogContent(dialogType, params, timeoutMs);

  // Apply title/body [应用标题/内容]
  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;

  // Handle external link clicks via main process shell.openExternal [处理链接点击，通过主进程 shell.openExternal 打开]
  bodyEl.querySelectorAll('[data-open-external]').forEach((a: Element) => {
    a.addEventListener('click', (ev: Event) => {
      ev.preventDefault();
      const u = a.getAttribute('data-open-external');
      if (u) openExternal(u);
    });
  });

  // Render buttons [渲染按钮]
  buttonsEl.innerHTML = '';
  buttons.sort((a, b) => a.index - b.index).forEach((btn: DialogButton) => {
    const b = document.createElement('button');
    b.className = 'custom-confirm-btn ' + (btn.style || 'default');
    b.textContent = btn.label;
    b.addEventListener('click', () => {
      if (typeof btn.onClick === 'function') {
        try { btn.onClick(); } catch { /* ignore [忽略] */ }
      }
      sendResponse(btn.index);
    });
    buttonsEl.appendChild(b);
  });

  // Show dialog [显示弹窗]
  (modalEl as HTMLElement).style.display = 'flex';
}

/**
 * Bind updater dialog listener (receives dialog show events from main process) [绑定更新器弹窗监听 (接收来自主进程的弹窗显示事件)]
 */
export function bindUpdaterDialogListener(): void {
  if (!window.sparklet) return;
  updaterApi.onDialogShow((payload) => {
    const p = payload as unknown as UpdaterDialogParams;
    console.log('[Settings] Received updater dialog show:', p.dialogType);
    showUpdaterDialog(p.dialogId, p.dialogType, p.params || {}, p.timeoutMs || 0);
  });
}
