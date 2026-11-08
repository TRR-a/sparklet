// Cache expiry policy [缓存过期策略]

import { CACHE_UNUSED_RETENTION_DAYS } from '../constants/constants.js';
import type { CacheEntry } from 'sparklet/shared/types/updater/updater.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whether the entry is past its time-based retention [条目是否已超过按时间的保留期] */
export function isEntryExpired(entry: CacheEntry, now: number, okDays: number): boolean {
  let expireMs: number;
  let baseline: number;
  if (entry.successFirstLaunchAt) {
    baseline = new Date(entry.successFirstLaunchAt).getTime();
    expireMs = okDays * DAY_MS;
  } else {
    baseline = new Date(entry.downloadedAt).getTime();
    expireMs = CACHE_UNUSED_RETENTION_DAYS * DAY_MS;
  }
  return now - baseline > expireMs;
}

/** Version keys ordered for count-limit eviction (never-launched first, then oldest) [按数量上限淘汰的排序 (未成功打开的优先，再按最老)] */
export function orderVersionsForCountLimit(versions: Record<string, CacheEntry>): string[] {
  return Object.keys(versions)
    .map(v => ({
      v,
      hasSuccess: !!versions[v].successFirstLaunchAt,
      t: new Date(versions[v].downloadedAt).getTime()
    }))
    .sort((a, b) => {
      if (a.hasSuccess !== b.hasSuccess) return a.hasSuccess ? 1 : -1;
      return a.t - b.t;
    })
    .map(item => item.v);
}
