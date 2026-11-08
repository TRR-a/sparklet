// Cache cleanup & info - barrel [缓存清理与信息 - 汇总出口]
// clean expired cache, clear all/by-version, aggregate info for settings page [清理过期缓存、清空全部/按版本、聚合信息供设置页展示]
//
// Split out [已拆分]：cleanup → cache-cleanup-expired.ts, manual clear → cache-clear.ts,
// meta-reading info query → cache-info-query.ts.

export { cleanupExpired } from 'sparklet/main/updater/cache/cache-cleanup-expired.js';
export { clearAllCache, clearCacheByVersion } from 'sparklet/main/updater/cache/cache-clear.js';
export { getLatestCacheInfo } from 'sparklet/main/updater/cache/cache-info-query.js';
