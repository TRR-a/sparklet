// Toast: message resolution [Toast - 消息解析]

import { t } from '../../i18n/i18n.js';

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
