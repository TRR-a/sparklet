// Renderer global error hooks [渲染进程全局错误钩子]

import { errText, logApi } from 'sparklet/renderer/shared/api/log-api.js';

let hooksInstalled = false;

/**
 * Forward uncaught renderer errors to the log file (idempotent, call per page
 * entry with its module scope). Stack traces from window.onerror and unhandled
 * rejections are the most valuable lines when debugging user reports.
 * [将渲染进程未捕获错误转发到日志文件 (幂等，各页面入口按自己的模块 scope 调用一次)。
 *  window.onerror 与未处理 Promise 拒绝的堆栈是排查用户问题时最值钱的日志]
 */
export function installGlobalErrorHooks(scope: string = 'kernel'): void {
  if (hooksInstalled) return;
  hooksInstalled = true;
  window.addEventListener('error', (e) => {
    const detail = e.error ? errText(e.error) : `${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`;
    logApi.error(scope, detail);
  });
  window.addEventListener('unhandledrejection', (e) => {
    logApi.error(scope, 'Unhandled rejection:', errText(e.reason));
  });
}
