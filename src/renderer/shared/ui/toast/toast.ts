// Toast utility - shared toast display for all pages [Toast 工具 - 所有页面共享的 Toast 显示]
// Supports both string messages and i18n key objects for language switching [支持字符串消息和 i18n key 对象两种格式，支持语言切换]
//
// Split out [已拆分]：types → toast-types.ts, message → toast-message.ts,
// DOM view → toast-view.ts, main-process listener → toast-listener.ts.

export type { ToastType, ToastEventData } from 'sparklet/renderer/shared/ui/toast/toast-types.js';
export { resolveToastMessage } from 'sparklet/renderer/shared/ui/toast/toast-message.js';
export { showToast } from 'sparklet/renderer/shared/ui/toast/toast-view.js';
export { bindToastListener } from 'sparklet/renderer/shared/ui/toast/toast-listener.js';
