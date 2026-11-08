// Toast: main-process event listener [Toast - 主进程事件监听]

import { updaterApi } from 'sparklet/renderer/shared/index.js';
import type { ToastEventData, ToastType } from 'sparklet/renderer/shared/ui/toast/toast-types.js';
import { resolveToastMessage } from 'sparklet/renderer/shared/ui/toast/toast-message.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast/toast-view.js';

/**
 * Bind Toast listener to receive Toast events from main process [绑定 Toast 监听，接收来自主进程的 Toast 事件]
 */
export function bindToastListener(defaultFallback: string = '提示'): void {
  updaterApi.onToastShow((data: ToastEventData) => {
    const message = resolveToastMessage(data.message, defaultFallback);
    const duration = data.duration || 3000;
    const type = (data.type || 'info') as ToastType;
    showToast(message, type, duration);
  });
}
