// Config store: in-memory state [配置存储 - 内存状态]

import type { UpdaterConfig } from 'sparklet/shared/types/updater/updater.js';

let cachedConfig: UpdaterConfig | null = null;
let isSelfWrite = false;

/** Get the cached config, if any [获取缓存配置] */
export function getCachedConfig(): UpdaterConfig | null {
  return cachedConfig;
}

/** Replace the cached config [替换缓存配置] */
export function setCachedConfig(config: UpdaterConfig | null): void {
  cachedConfig = config;
}

/** Mark whether the next file change is caused by our own write [标记下一次文件变化是否由自身写入触发] */
export function markSelfWrite(value: boolean): void {
  isSelfWrite = value;
}

/** Consume the self-write flag (returns previous value and resets) [消费自身写入标记 (返回旧值并重置)] */
export function consumeSelfWrite(): boolean {
  const value = isSelfWrite;
  isSelfWrite = false;
  return value;
}

/** Invalidate cached config so the next read reloads from disk [失效配置缓存，使下次读取从磁盘重新加载] */
export function invalidateConfigCache(): void {
  cachedConfig = null;
}
