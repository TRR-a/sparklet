// Cache: mark successful first launch [缓存 - 标记首次成功启动]

import { readMeta, writeMeta } from './cache-meta.js';

/**
 * Mark a version's "first successful launch" time (called 30s after startup, anti-instant-crash) [标记某版本「第一次成功打开」时间 (启动后延迟 30s 调用，防秒崩)]
 */
export async function markSuccessFirstLaunch(version: string): Promise<boolean> {
  const meta = await readMeta();
  if (!meta.versions[version]) {
    console.log('[CacheManager] markSuccessFirstLaunch: version not in cache, skip:', version);
    return false;
  }
  if (meta.versions[version].successFirstLaunchAt) {
    return true; // Already marked, don't rewrite [已经标记过，不再重复写]
  }
  meta.versions[version].successFirstLaunchAt = new Date().toISOString();
  await writeMeta(meta);
  console.log('[CacheManager] Marked successFirstLaunchAt for', version);
  return true;
}
