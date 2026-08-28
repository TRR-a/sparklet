// Toast utility - shared toast display for all pages [Toast 工具 - 所有页面共享的 Toast 显示]
// Supports both string messages and i18n key objects for language switching [支持字符串消息和 i18n key 对象两种格式，支持语言切换]

import { t } from '../Modules/i18n.js';

/** Toast type [Toast 类型] */
export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'danger';

/** Toast data received from main process [从主进程接收的 Toast 数据] */
export interface ToastEventData {
  message: string | { key: string; params?: Record<string, string> };
  type: ToastType;
  duration: number;
}

/**
 * Resolve message: if it's an i18n key object, translate via t(); otherwise return as-is [解析消息：如果是 i18n key 对象，通过 t() 翻译；否则原样返回]
 */
export function resolveToastMessage(
  message: string | { key: string; params?: Record<string, string> } | undefined,
  fallback: string = '提示'
): string {
  if (!message) return fallback;
  if (typeof message === 'object' && message.key) {
    return t(message.key, message.params || {});
  }
  return String(message);
}

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

  // Set background color based on type [根据 type 设置背景色]
  let bg = 'rgba(0, 0, 0, 0.8)';
  if (type === 'warning') bg = 'rgba(245, 158, 11, 0.95)';
  if (type === 'error' || type === 'danger') bg = 'rgba(239, 68, 68, 0.95)';
  if (type === 'success') bg = 'rgba(16, 185, 129, 0.95)';

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 24px',
    borderRadius: '8px',
    background: bg,
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '9999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none'
  });

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Bind Toast listener to receive Toast events from main process [绑定 Toast 监听，接收来自主进程的 Toast 事件]
 */
export function bindToastListener(defaultFallback: string = '提示'): void {
  window.electronAPI.onToastShow((data: ToastEventData) => {
    const message = resolveToastMessage(data.message, defaultFallback);
    const duration = data.duration || 3000;
    const type = (data.type || 'info') as ToastType;
    showToast(message, type, duration);
  });
}
