// Cache retention load/save (debounced IPC) - barrel [缓存保留天数读写 (防抖 IPC) - 汇总出口]
//
// Split out [已拆分]：save → cache-retention-save.ts, load → cache-retention-load.ts.

export { saveRetentionDays } from 'sparklet/renderer/app/settings/cache/retention/scripts/cache-retention-save.js';
export { loadCacheRetentionDays } from 'sparklet/renderer/app/settings/cache/retention/scripts/cache-retention-load.js';
