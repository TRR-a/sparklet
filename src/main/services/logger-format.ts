// Logger: level + formatting [日志 - 级别与格式化]

/** Log level [日志级别] */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Weight used for level filtering [用于级别过滤的权重] */
export const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Zero-pad a number [数字补零] */
export function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

/** Format a timestamp for the log line prefix [格式化日志行前缀时间戳] */
export function timestamp(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

/** Serialize an Error with its stack, anything else via String [Error 连堆栈序列化，其余走 String] */
export function errText(err: unknown): string {
  if (err instanceof Error) return err.stack || `${err.name}: ${err.message}`;
  return String(err);
}
