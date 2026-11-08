// Toast: DOM presentation [Toast - DOM 呈现]
//
// Split out [已拆分]：style builder → toast-style.ts.

import type { ToastType } from 'sparklet/renderer/shared/ui/toast/toast-types.js';
import { buildToastStyle } from 'sparklet/renderer/shared/ui/toast/toast-style.js';

/**
 * Show a toast message (shared implementation) [显示 Toast 消息 (共享实现)]
 * @param message Text to display [要显示的文本]
 * @param type Toast type (info/success/warning/error) [Toast 类型]
 * @param duration Display duration in ms [显示时长 (毫秒)]
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  duration: number = 3000
): void {
  // Remove existing toast [移除已有的 Toast]
  const existing = document.querySelector('.toast-message');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.dataset.type = type;
  toast.textContent = message;
  Object.assign(toast.style, buildToastStyle(type));

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
