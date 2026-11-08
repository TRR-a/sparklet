// Toast: style builder [Toast - 样式构建]

import type { ToastType } from 'sparklet/renderer/shared/ui/toast/toast-types.js';

/** Resolve the background color for a toast type [解析 Toast 类型的背景色] */
export function toastBackground(type: ToastType): string {
  if (type === 'warning') return 'rgba(245, 158, 11, 0.95)';
  if (type === 'error' || type === 'danger') return 'rgba(239, 68, 68, 0.95)';
  if (type === 'success') return 'rgba(16, 185, 129, 0.95)';
  return 'rgba(0, 0, 0, 0.8)';
}

/** Build the toast inline style [构建 Toast 内联样式] */
export function buildToastStyle(type: ToastType): Record<string, string> {
  return {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 24px',
    borderRadius: '8px',
    background: toastBackground(type),
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '9999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none'
  };
}
