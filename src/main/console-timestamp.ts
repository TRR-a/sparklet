// Global console timestamp prefix for terminal output: [HH:mm:ss.SSS] [tag] message
// Log files keep full yyyy-MM-dd HH:mm:ss.SSS (see logger.ts); terminal stays compact.
// [终端控制台时间戳前缀：[HH:mm:ss.SSS]；日志文件保留完整时间戳 (见 logger.ts)，终端保持紧凑]
// Must be imported early (after dev-user-data) so all console output gets the prefix.
// [必须在 dev-user-data 之后尽早 import，让所有控制台输出都带时间戳]

const origLog = console.log.bind(console);
const origInfo = console.info.bind(console);
const origWarn = console.warn.bind(console);
const origError = console.error.bind(console);
const origDebug = console.debug.bind(console);

function pad(n: number, w = 2): string { return String(n).padStart(w, '0'); }

function ts(): string {
  const d = new Date();
  return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}]`;
}

console.log = (...args: unknown[]): void => { origLog(ts(), ...args); };
console.info = (...args: unknown[]): void => { origInfo(ts(), ...args); };
console.warn = (...args: unknown[]): void => { origWarn(ts(), ...args); };
console.error = (...args: unknown[]): void => { origError(ts(), ...args); };
console.debug = (...args: unknown[]): void => { origDebug(ts(), ...args); };
