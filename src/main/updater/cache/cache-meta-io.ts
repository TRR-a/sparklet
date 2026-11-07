// Cache meta: directory readiness + read/write [缓存元数据 - 目录就绪与读写]

import * as fs from 'fs-extra';
import {
  getUpdateCacheDir,
  getUpdateCacheMetaPath,
} from '../core/updater-paths.js';
import type { CacheMeta } from 'sparklet/shared/types/updater';

/**
 * Ensure cache directory and meta file exist [确保缓存目录和 meta 文件存在]
 */
export async function ensureCacheReady(): Promise<void> {
  const cacheDir = getUpdateCacheDir();
  await fs.ensureDir(cacheDir);
  const metaPath = getUpdateCacheMetaPath();
  if (!(await fs.pathExists(metaPath))) {
    await fs.writeFile(metaPath, JSON.stringify({ versions: {} }, null, 2), 'utf8');
  }
}

/**
 * Read cache metadata [读取缓存元数据]
 */
export async function readMeta(): Promise<CacheMeta> {
  await ensureCacheReady();
  const metaPath = getUpdateCacheMetaPath();
  try {
    const data = await fs.readJson(metaPath) as CacheMeta;
    if (!data || typeof data !== 'object' || !data.versions) {
      return { versions: {} };
    }
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[CacheManager] Failed to parse cache meta, resetting:', msg);
    const fresh: CacheMeta = { versions: {} };
    await fs.writeFile(metaPath, JSON.stringify(fresh, null, 2), 'utf8');
    return fresh;
  }
}

/**
 * Write cache metadata [写入缓存元数据]
 */
export async function writeMeta(meta: CacheMeta): Promise<void> {
  await ensureCacheReady();
  const metaPath = getUpdateCacheMetaPath();
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
}
