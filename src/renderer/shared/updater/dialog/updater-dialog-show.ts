// Updater dialog: show + render [更新器弹窗 - 显示与渲染]

import { buildDialogContent, openExternal } from './content/updater-dialog-content.js';
import { makeDialogResponder } from './updater-dialog-response.js';
import { renderDialogButtons } from './updater-dialog-buttons.js';

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
  const sendResponse = makeDialogResponder(modalEl as HTMLElement, dialogId);

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
  renderDialogButtons(buttonsEl, buttons, (index) => { void sendResponse(index); });

  // Show dialog [显示弹窗]
  (modalEl as HTMLElement).style.display = 'flex';
}
