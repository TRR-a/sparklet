// Cache registry & query - register downloaded ZIP, mark successful launch, get/verify cached ZIP [缓存注册与查询 - 注册下载 ZIP、标记成功打开、获取/校验缓存 ZIP]

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  getUpdateCacheDir,
  CACHE_MAX_VERSIONS,
  PACKAGE_NAME_PATTERN
} from './constants';
import { ensureCacheReady, readMeta, writeMeta, removeVersionCache } from './cache-meta';
import type {
  CacheEntry,
  VerifyCachedZipResult
} from '../../shared/types/updater';

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

  // If exceeding max retention count, prioritize deleting "never successfully launched" and "oldest download" versions, excluding just-registered version [超过最大保留数，优先删「未成功打开」且「下载时间最久」的，排除刚注册的版本]
  const versionKeys = Object.keys(meta.versions);
  if (versionKeys.length > CACHE_MAX_VERSIONS) {
    const sorted = versionKeys
      .filter(v => v !== version)  // Don't delete just-registered [不删刚注册的]
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

  await writeMeta(meta);
  console.log('[CacheManager] Registered cached zip:', version, '->', destZipPath);
  return destZipPath;
}

/**
 * Mark a version's "first successful launch" time (called 30s after startup, anti-instant-crash) [标记某版本「第一次成功打开」时间 (启动后延迟 30s 调用，防秒崩)]
 */
export async function markSuccessFirstLaunch(version: string): Promise<boolean> {
  const meta = await readMeta();
  if (!meta.versions[version]) {
    console.log('[CacheManager] markSuccessFirstLaunch: version not in cache, skip:', version);
    return false;
  }
  if (meta.versions[version].successFirstLaunchAt) {
    return true; // Already marked, don't rewrite [已经标记过，不再重复写]
  }
  meta.versions[version].successFirstLaunchAt = new Date().toISOString();
  await writeMeta(meta);
  console.log('[CacheManager] Marked successFirstLaunchAt for', version);
  return true;
}

/**
 * Get cached ZIP absolute path for a version (if exists and has meta record) [获取指定版本的缓存 ZIP 绝对路径 (如果存在且 meta 中有记录)]
 * No integrity check, only returns path; caller can verify with packageHash [不做完整性校验，只返回路径；调用方可自行用 packageHash 校验]
 */
export async function getCachedZipPath(version: string): Promise<string | null> {
  const meta = await readMeta();
  const entry = meta.versions[version];
  if (!entry || !entry.zipFilename) return null;
  const zipPath = path.join(getUpdateCacheDir(), entry.zipFilename);
  const exists = await fs.pathExists(zipPath);
  if (!exists) return null;
  return zipPath;
}

/**
 * Quick check if cached ZIP for a version is intact (compare packageHash) [快速检查缓存中指定版本的 ZIP 是否完好 (对比 packageHash)]
 * @param computeSha256Fn Optional SHA256 function (injected to avoid circular dep with verify.ts) [可选的 SHA256 函数 (注入以避免与 verify.ts 循环依赖)]
 */
export async function verifyCachedZip(
  version: string,
  computeSha256Fn?: ((filePath: string) => Promise<string>) | null
): Promise<VerifyCachedZipResult> {
  const meta = await readMeta();
  const entry = meta.versions[version];
  if (!entry || !entry.zipFilename || !entry.packageHash) {
    return { ok: false, zipPath: null, reason: 'no-entry-or-hash' };
  }
  const zipPath = path.join(getUpdateCacheDir(), entry.zipFilename);
  const exists = await fs.pathExists(zipPath);
  if (!exists) {
    return { ok: false, zipPath, reason: 'zip-missing' };
  }
  if (!computeSha256Fn) {
    return { ok: true, zipPath, packageHash: entry.packageHash, reason: 'no-hash-check' };
  }
  try {
    const actualHash = await computeSha256Fn(zipPath);
    if (actualHash !== entry.packageHash) {
      return { ok: false, zipPath, reason: 'hash-mismatch', actualHash, expectedHash: entry.packageHash };
    }
    return { ok: true, zipPath, packageHash: entry.packageHash };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, zipPath, reason: 'hash-error:' + msg };
  }
}
