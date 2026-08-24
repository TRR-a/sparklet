// Cache manager - entry point, re-exports public cache API [缓存管理 - 入口文件，re-export 公共缓存 API]
// Meta I/O layer in cache-meta.ts [元数据读写层在 cache-meta.ts]
// Registration & query in cache-registry.ts [注册与查询在 cache-registry.ts]
// Cleanup & info in cache-cleanup.ts [清理与信息在 cache-cleanup.ts]

export {
  registerCachedZip,
  markSuccessFirstLaunch,
  getCachedZipPath,
  verifyCachedZip,
} from './cache-registry';

export {
  cleanupExpired,
  clearAllCache,
  clearCacheByVersion,
  getLatestCacheInfo,
} from './cache-cleanup';
