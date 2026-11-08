// Logger: initialization + write pipeline - barrel [日志 - 初始化与写入流程 - 汇总出口]
//
// Split out [已拆分]：runtime state → logger-state.ts, init → logger-init.ts,
// write pipeline → logger-write-line.ts, logger object / scoped bridge → logger-instance.ts.

export { initLogger } from './logger-init.js';
export { markConsoleBroken } from './logger-state.js';
export { write } from './logger-write-line.js';
export { logger, writeScoped } from './logger-instance.js';
