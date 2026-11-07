// Cache cleanup: manual clear operations [缓存清理 - 手动清空操作]

import { readMeta, writeMeta, removeVersionCache } from './cache-meta.js';

/**
 * Clear all cache immediately (settings page button) [立即清空全部缓存 (设置页按钮)]
 */
export async function clearAllCache(): Promise<boolean> {
  const meta = await readMeta();
  const versions = Object.keys(meta.versions);
  for (const v of versions) {
    await removeVersionCache(meta, v);
  }
  meta.versions = {};
  await writeMeta(meta);
  console.log('[CacheManager] All cache cleared');
  return true;
}

/**
 * Delete cache for a specific version (finer-grained option for settings page, currently only full delete is used) [删除指定版本的缓存 (设置页更细粒度可选，目前只用全部删除)]
 */
export async function clearCacheByVersion(version: string): Promise<boolean> {
  const meta = await readMeta();
  if (!meta.versions[version]) return false;
  await removeVersionCache(meta, version);
  await writeMeta(meta);
  return true;
}
