// Cache: register downloaded zip + prune [缓存 - 注册下载包与修剪]
// Pruning lives in cache-register-prune.ts [修剪逻辑在 cache-register-prune.ts]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getUpdateCacheDir } from '../startup/updater-paths.js';
import { PACKAGE_NAME_PATTERN } from '../constants/constants.js';
import { ensureCacheReady, readMeta, writeMeta } from './cache-meta.js';
import { pruneCacheVersions } from './cache-register-prune.js';
import type { CacheEntry } from 'sparklet/shared/types/updater/updater.js';

/**
 * Sync downloaded ZIP to persistent cache directory and record meta [将下载完成的 ZIP 同步到持久缓存目录，并记录 meta]
 * @param srcZipPath Path of the just-downloaded ZIP in temp dir [临时目录中刚下载好的 ZIP 路径]
 * @param version Version number (e.g. "v0.2.2") [版本号 (如 "v0.2.2")]
 * @param packageHash Verified packageHash [已校验通过的 packageHash]
 */
export async function registerCachedZip(srcZipPath: string, version: string, packageHash: string | null): Promise<string> {
  await ensureCacheReady();
  const cacheDir = getUpdateCacheDir();

  const srcFilename = path.basename(srcZipPath);
  if (!PACKAGE_NAME_PATTERN.test(srcFilename)) {
    throw new Error(`Invalid zip filename, not matching package pattern: ${srcFilename}`);
  }

  const exists = await fs.pathExists(srcZipPath);
  if (!exists) {
    throw new Error(`Source zip not found: ${srcZipPath}`);
  }

  const destZipPath = path.join(cacheDir, srcFilename);
  // If file with same name exists, delete first then copy (avoid partial files) [若已有同名文件，先删再拷 (避免半残文件)]
  if (await fs.pathExists(destZipPath)) {
    await fs.remove(destZipPath);
  }
  await fs.copy(srcZipPath, destZipPath);

  const meta = await readMeta();
  const entry: CacheEntry = {
    version,
    zipFilename: srcFilename,
    packageHash: packageHash || null,
    downloadedAt: new Date().toISOString(),
    successFirstLaunchAt: null
  };
  meta.versions[version] = entry;

  await pruneCacheVersions(meta, version);

  await writeMeta(meta);
  console.log('[CacheManager] Registered cached zip:', version, '->', destZipPath);
  return destZipPath;
}
