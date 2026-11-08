// Config store - barrel [配置存储 - 汇总出口]
// Read/write and item-level API [读写与项级 API]
//
// Split out [已拆分]：state → config-state.ts, read → config-read.ts,
// write → config-write.ts, item accessors → config-items.ts.

export {
  markSelfWrite,
  consumeSelfWrite,
  invalidateConfigCache,
} from './config-state.js';
export { readConfig } from './config-read.js';
export { writeConfig } from './config-write.js';
export type { ConfigWriteResult } from './config-write.js';
export {
  getConfigItem,
  setConfigItem,
  getCheckInterval,
  getUpdateBehavior,
} from './config-items.js';
