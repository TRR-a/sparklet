// Config directory resolution (cached) [配置目录解析 (带缓存)]
//
// Split out [已拆分]：result type → config-dir-types.ts,
// single candidate → config-dir-try.ts, candidate walk → config-dir-resolve.ts.

import type { ConfigDirResult } from './config-dir-types.js';
import { resolveConfigDir } from './config-dir-resolve.js';

export type { ConfigDirResult } from './config-dir-types.js';

// Config directory state [配置目录状态]
let configDir: string | null = null;
let configDirPromise: Promise<ConfigDirResult> | null = null;

/**
 * Get config directory (auto-try three candidates, cache result) [获取配置目录 (自动尝试三个候选，并缓存结果)]
 */
export async function getConfigDir(): Promise<ConfigDirResult> {
  if (configDir) {
    return { success: true, path: configDir, error: null };
  }
  // Deduplicate concurrent calls [并发调用去重]
  if (configDirPromise) return configDirPromise;

  configDirPromise = (async () => {
    const result = await resolveConfigDir();
    if (result.success) configDir = result.path;
    return result;
  })();

  const result = await configDirPromise;
  configDirPromise = null;
  return result;
}
