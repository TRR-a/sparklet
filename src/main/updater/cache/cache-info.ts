// Cache info aggregation for settings page display - barrel [缓存信息聚合，供设置页展示 - 汇总出口]
// Reads cache meta and computes display-ready info (size, retention, remaining days) [读取缓存 meta 并计算展示用信息 (大小、保留策略、剩余天数)]
//
// Split out [已拆分]：size/format → cache-size-format.ts,
// retention math → cache-retention-info.ts,
// empty shape → cache-info-empty.ts, aggregation → cache-info-latest.ts.

export { getFileSize, formatBytes } from 'sparklet/main/updater/cache/cache-size-format.js';
export { getLatestCacheInfo } from 'sparklet/main/updater/cache/cache-info-latest.js';
