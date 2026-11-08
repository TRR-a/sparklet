// Cache meta: single version removal [缓存元数据 - 删除单版本]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getUpdateCacheDir } from 'sparklet/main/updater/startup/updater-paths.js';
import type { CacheMeta } from 'sparklet/shared/types/updater/updater.js';

/**
 * Delete single version cache (zip file + meta entry) [删除单个版本缓存 (zip 文件 + meta 条目)]
 */
export async function removeVersionCache(meta: CacheMeta, version: string): Promise<void> {
  const entry = meta.versions[version];
  if (entry && entry.zipFilename) {
    const zipPath = path.join(getUpdateCacheDir(), entry.zipFilename);
    try {
      if (await fs.pathExists(zipPath)) {
        await fs.remove(zipPath);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[CacheManager] Failed to remove cached zip:', zipPath, msg);
    }
  }
  delete meta.versions[version];
}
