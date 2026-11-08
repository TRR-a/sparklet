// Cache: prune excess versions [缓存 - 修剪超出上限的版本]

import { CACHE_MAX_VERSIONS } from 'sparklet/main/updater/constants/constants.js';
import { removeVersionCache } from 'sparklet/main/updater/cache/cache-meta.js';
import type { CacheMeta } from 'sparklet/shared/types/updater/updater.js';

/**
 * Trim the cache down to CACHE_MAX_VERSIONS, never removing the just-registered version
 * [把缓存修剪到上限，且绝不删除刚注册的版本]
 */
export async function pruneCacheVersions(meta: CacheMeta, keepVersion: string): Promise<void> {
  // If exceeding max retention count, prioritize deleting "never successfully launched" and "oldest download" versions, excluding just-registered version [超过最大保留数，优先删「未成功打开」且「下载时间最久」的，排除刚注册的版本]
  const versionKeys = Object.keys(meta.versions);
  if (versionKeys.length > CACHE_MAX_VERSIONS) {
    const sorted = versionKeys
      .filter(v => v !== keepVersion)  // Don't delete just-registered [不删刚注册的]
      .map(v => ({
        v,
        hasSuccess: !!meta.versions[v].successFirstLaunchAt,
        t: new Date(meta.versions[v].downloadedAt).getTime()
      }))
      .sort((a, b) => {
        // Prioritize deleting never-launched (hasSuccess=false sorts first) [优先删未成功打开的 (hasSuccess=false 排前面)]
        if (a.hasSuccess !== b.hasSuccess) return a.hasSuccess ? 1 : -1;
        return a.t - b.t;
      });
    const toRemove = sorted.slice(0, versionKeys.length - CACHE_MAX_VERSIONS);
    for (const item of toRemove) {
      await removeVersionCache(meta, item.v);
    }
  }
}
