// Renderer-side log API [渲染进程日志 API]
// The first argument is always the module scope: 'kernel' (or omitted) routes to
// the core folder, any other name (e.g. 'note') routes to logs/modules/<scope>/.
// Lines are forwarded to the main process and mirrored to the console.
// Usage: logApi.info('kernel', 'ready');  logApi.info('note', 'saved');
// [第一个参数恒为模块 scope：'kernel'(或省略) 写入核心目录，其他名 (如 'note') 写入
//  logs/modules/<scope>/。日志经主进程落盘并镜像到控制台。用法同上]

import { bus } from './ipc-bus.js';

type Level = 'debug' | 'info' | 'warn' | 'error';

function stringify(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function send(level: Level, scope: string, args: unknown[]): void {
  const message = args.map(stringify).join(' ');
  try {
    bus.send('logger:write', { level, scope, message });
  } catch { /* logging must never break the UI [日志不应影响界面] */ }
  const out = level === 'debug' ? console.log : console[level];
  out(`[${scope}]`, ...args);
}

export const logApi = {
  debug: (scope: string, ...args: unknown[]): void => send('debug', scope, args),
  info: (scope: string, ...args: unknown[]): void => send('info', scope, args),
  warn: (scope: string, ...args: unknown[]): void => send('warn', scope, args),
  error: (scope: string, ...args: unknown[]): void => send('error', scope, args),
};
