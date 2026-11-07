// Cache info query (meta-reading wrapper) [缓存信息查询 - 读 meta 的包装]

import { readMeta } from './cache-meta.js';
import { getLatestCacheInfo as computeLatestCacheInfo } from './cache-info.js';
import type { CacheInfo } from 'sparklet/shared/types/updater';

/**
 * Get cache info of the "latest version" (settings page only shows the latest one) [取「最新的一个版本」的缓存信息 (设置页只展示最新的那一个)]
 * Reads meta then delegates to cache-info.ts for computation [读取 meta 后委托给 cache-info.ts 计算]
 * @param successRetentionDays Retention days after successful launch (7~30, from config; default 7 if omitted) [成功打开后的保留天数 (7~30，由配置传入；缺省用默认 7 天)]
 */
export async function getLatestCacheInfo(successRetentionDays?: number | null): Promise<CacheInfo> {
  const meta = await readMeta();
  return computeLatestCacheInfo(meta, successRetentionDays);
}
