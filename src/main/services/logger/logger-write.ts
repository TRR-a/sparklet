// Logger: initialization + write pipeline - barrel [日志 - 初始化与写入流程 - 汇总出口]
//
// Split out [已拆分]：runtime state → logger-state.ts, init → logger-init.ts,
// write pipeline → logger-write-line.ts, logger object / scoped bridge → logger-instance.ts.

export { initLogger } from 'sparklet/main/services/logger/logger-init.js';
export { markConsoleBroken } from 'sparklet/main/services/logger/logger-state.js';
export { write } from 'sparklet/main/services/logger/logger-write-line.js';
export { logger, writeScoped } from 'sparklet/main/services/logger/logger-instance.js';
