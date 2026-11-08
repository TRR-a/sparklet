// Settings cache: cache presence check [设置缓存 - 缓存存在性检查]

import { updaterApi } from 'sparklet/renderer/shared/index.js';

/** Read whether any cache exists (errors are treated as "no cache") [读取是否有缓存；异常按无缓存处理] */
export async function hasAnyCache(): Promise<boolean> {
  // Check if there's any cache first [先读一次看看有没有缓存]
  try {
    const r = await updaterApi.getCacheInfo();
    return !!(r && r.success && r.info && r.info.hasCache);
  } catch {
    /* ignore [忽略] */
    return false;
  }
}
