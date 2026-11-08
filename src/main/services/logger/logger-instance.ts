// Logger: leveled logger object + scoped bridge [日志 - 分级 logger 对象与模块 scope 桥]

import type { LogLevel } from './logger-format.js';
import { write } from './logger-write-line.js';

/** Leveled logger for main-process code; always writes to the core folder [主进程分级 logger，固定写入核心目录] */
export const logger = {
  debug: (tag: string, message: string): void => write('debug', 'main', tag, message),
  info: (tag: string, message: string): void => write('info', 'main', tag, message),
  warn: (tag: string, message: string): void => write('warn', 'main', tag, message),
  error: (tag: string, message: string): void => write('error', 'main', tag, message),
};

/** Write a log line on behalf of a module scope (used by the renderer IPC bridge) [代指定模块 scope 写日志 (供渲染 IPC 桥调用)] */
export function writeScoped(level: LogLevel, scope: string, tag: string, message: string): void {
  write(level, scope || 'main', tag, message);
}
