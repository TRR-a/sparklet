// File logger for the main process [主进程文件日志]
// Entry point, re-exports logger API [入口文件，re-export 日志 API]
// Writer & rotation in logger-writer.ts, crash capture in crash-logging.ts [写入与轮转在 logger-writer.ts，崩溃捕获在 crash-logging.ts]

export type { LogLevel } from 'sparklet/main/services/logger/logger-writer.js';
export {
  initLogger,
  errText,
  logger,
  writeScoped,
  getLogRoot,
} from 'sparklet/main/services/logger/logger-writer.js';
export { installCrashLogging } from 'sparklet/main/services/crash-logging.js';
