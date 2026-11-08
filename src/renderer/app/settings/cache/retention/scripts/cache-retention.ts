// Cache retention days configuration - entry barrel [缓存保留天数配置 - 入口]
// Constants → cache-retention-constants.ts, state → cache-retention-state.ts,
// UI sync → cache-retention-ui.ts, load/save → cache-retention-io.ts.
// [常量 → cache-retention-constants.ts，状态 → cache-retention-state.ts，
//  UI 同步 → cache-retention-ui.ts，读写 → cache-retention-io.ts]

export { RETENTION_MIN, RETENTION_MAX, RETENTION_DEFAULT, clampRetentionDays } from './cache-retention-constants.js';
export { getCurrentRetentionDays } from './cache-retention-state.js';
export { applyRetentionUI } from './cache-retention-ui.js';
export { saveRetentionDays, loadCacheRetentionDays } from './cache-retention-io.js';
