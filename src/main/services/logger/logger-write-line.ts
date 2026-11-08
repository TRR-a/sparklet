// Logger: single-line write pipeline [日志 - 单行写入管线]

import * as fs from 'fs';
import { LEVEL_WEIGHT, timestamp } from 'sparklet/main/services/logger/logger-format.js';
import type { LogLevel } from 'sparklet/main/services/logger/logger-format.js';
import { resolve } from 'sparklet/main/services/logger/logger-paths.js';
import { getMinWeight, isConsoleBroken, isLoggerReady } from 'sparklet/main/services/logger/logger-state.js';

/** Write a log line [写入一行日志] */
export function write(level: LogLevel, scope: string, tag: string, message: string): void {
  if (!isLoggerReady() || LEVEL_WEIGHT[level] < getMinWeight()) return;
  const { dir, file } = resolve(scope);
  // Multi-line messages (stack traces): continuation lines are indented to the
  // message column so one entry stays visually one block [多行消息 (堆栈)：续行缩进到
  // 正文列，单条日志在视觉上仍是一个整体]
  const prefix = `[${timestamp(new Date())}] [${level.toUpperCase().padEnd(5)}] [${tag}] `;
  const body = message.split('\n').join(`\n${' '.repeat(prefix.length)}`);
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(file, prefix + body + '\n');
  } catch { /* never let logging crash the app [日志写入失败绝不影响应用] */ }
  if (!isConsoleBroken()) {
    const out = level === 'debug' ? console.log : console[level];
    try { out(`[${tag}] ${message}`); } catch { /* ignore console failures [控制台失败忽略] */ }
  }
}
