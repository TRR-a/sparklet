// Cache meta I/O layer - barrel [缓存元数据读写层 - 汇总出口]
// Shared foundation imported by cache-registry.ts and cache-cleanup.ts [供 cache-registry.ts 与 cache-cleanup.ts 导入的共享基础层]
//
// Split out [已拆分]：readiness/read/write → cache-meta-io.ts,
// single version removal → cache-meta-remove.ts.

export { ensureCacheReady, readMeta, writeMeta } from 'sparklet/main/updater/cache/cache-meta-io.js';
export { removeVersionCache } from 'sparklet/main/updater/cache/cache-meta-remove.js';
