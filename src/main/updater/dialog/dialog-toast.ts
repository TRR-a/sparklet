// Toast broadcast [Toast 广播]

import { BrowserWindow } from 'electron';
import type { ToastData } from 'sparklet/shared/types/updater/updater.js';

/**
 * Broadcast Toast to all windows [向所有窗口发送 Toast (广播)]
 * message supports two formats: [message 支持两种格式：]
 *   - String: display directly (backward compat), won't auto-translate on language switch [字符串：直接显示 (兼容旧代码)，不会随语言切换自动翻译]
 *   - { key: 'i18n.key.path', params?: { foo: 'bar' } }: renderer calls t(key, params) to translate, supports language switch [{ key: 'i18n.key.path', params?: { foo: 'bar' } }：渲染层会调 t(key, params) 翻译，支持语言切换]
 */
export function broadcastToast(
  message: string | { key: string; params?: Record<string, string> },
  type: ToastData['type'] = 'info',
  duration: number = 3000
): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('toast:show', { message, type, duration });
    }
  }
  const msgForLog = typeof message === 'string' ? message : `i18n:${message?.key}`;
  console.log('[Updater] Toast broadcast: type=' + type + ', duration=' + duration + 'ms, msg=' + msgForLog);
}
