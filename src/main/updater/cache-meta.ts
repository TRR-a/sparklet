// Cache meta I/O layer - directory/meta readiness, read/write, single version removal [缓存元数据读写层 - 目录/meta 就绪、读写、单版本删除]
// Shared foundation imported by cache-registry.ts and cache-cleanup.ts [供 cache-registry.ts 与 cache-cleanup.ts 导入的共享基础层]

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  getUpdateCacheDir,
  getUpdateCacheMetaPath,
} from './constants';
import type { CacheMeta } from '../../shared/types/updater';

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
