// Update package persistent cache management: [更新包持久缓存管理：]
// - After ZIP download, sync to userData/update_cache/ (long-term retention, not cleaned with temp dir) [下载完 ZIP 后同步到 userData/update_cache/ (长期保留，不随临时目录清理)]
// - Cache retention policy: successfully launched versions retained X days (X user-configurable, 7~30, default 7); unused versions fallback 30 days; keep at most 2 versions simultaneously [缓存保留策略：成功打开过的版本保留 X 天 (X 由用户配置，7~30，默认 7)；未成功使用的版本兜底 30 天；最多同时保留 2 个版本]
// - Startup self-check failure → if cache has intact ZIP, rollback install directly; if cache ZIP corrupted, delete and prompt to download from official site [启动时自检失败 → 若缓存中有完好 ZIP，直接走回滚安装；若缓存 ZIP 损坏则删除并提示从官网下载]
// - Settings page can manually view cache info, delete cache immediately [设置页可手动查看缓存信息、立即删除缓存]

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  getUpdateCacheDir,
  getUpdateCacheMetaPath,
  DEFAULT_CACHE_SUCCESS_RETENTION_DAYS,
  CACHE_UNUSED_RETENTION_DAYS,
  CACHE_MAX_VERSIONS,
  PACKAGE_NAME_PATTERN
} from './constants';
import { getLatestCacheInfo as computeLatestCacheInfo } from './cache-info';
import type {
  CacheEntry,
  CacheMeta,
  CacheInfo,
  VerifyCachedZipResult
} from '../../shared/types/updater';

// ---------- Basic read/write [基础读写] ----------

/**
 * Ensure cache directory and meta file exist [确保缓存目录和 meta 文件存在]
 */
async function ensureCacheReady(): Promise<void> {
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
async function readMeta(): Promise<CacheMeta> {
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
async function writeMeta(meta: CacheMeta): Promise<void> {
  await ensureCacheReady();
  const metaPath = getUpdateCacheMetaPath();
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
}

// ---------- Cache registration / sync [缓存注册 / 同步] ----------

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

// ---------- Mark successful launch [标记成功打开] ----------

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

// ---------- Get cached ZIP for a version [获取某个版本的缓存 ZIP] ----------

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

// ---------- Delete single version cache [删除单个版本缓存] ----------

async function removeVersionCache(meta: CacheMeta, version: string): Promise<void> {
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

// ---------- Clean expired cache [清理过期缓存] ----------

/**
 * Clean expired cache based on retention policy [根据保留策略清理过期缓存]
 * - Has successFirstLaunchAt: expired after 7 days → delete [有 successFirstLaunchAt：超过 7 天 → 删]
 * - No successFirstLaunchAt: expired after 30 days → delete [没 successFirstLaunchAt：超过 30 天 → 删]
 * - Exceeds CACHE_MAX_VERSIONS: delete oldest [超过 CACHE_MAX_VERSIONS：删最老的]
 * @param successRetentionDays Retention days after successful launch (7~30, from config; default 7 if omitted) [成功打开后的保留天数 (7~30，由配置传入；缺省用默认 7 天)]
 */
export async function cleanupExpired(successRetentionDays?: number | null): Promise<number> {
  const okDays = Number.isFinite(successRetentionDays as number) && (successRetentionDays as number) > 0
    ? successRetentionDays as number
    : DEFAULT_CACHE_SUCCESS_RETENTION_DAYS;

  const meta = await readMeta();
  const now = Date.now();
  const versionKeys = Object.keys(meta.versions);
  let removedCount = 0;

  // Round 1: delete by time expiry [第 1 轮：按时间删过期的]
  for (const version of versionKeys) {
    const entry = meta.versions[version];
    if (!entry) continue;
    let expireMs: number;
    let baseline: number;
    if (entry.successFirstLaunchAt) {
      baseline = new Date(entry.successFirstLaunchAt).getTime();
      expireMs = okDays * 24 * 60 * 60 * 1000;
    } else {
      baseline = new Date(entry.downloadedAt).getTime();
      expireMs = CACHE_UNUSED_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    }
    if (now - baseline > expireMs) {
      await removeVersionCache(meta, version);
      removedCount++;
    }
  }

  // Round 2: delete oldest by count limit (prioritize never-launched) [第 2 轮：按数量上限删最老的 (优先删未成功打开的)]
  const remaining = Object.keys(meta.versions)
    .map(v => ({
      v,
      hasSuccess: !!meta.versions[v].successFirstLaunchAt,
      t: new Date(meta.versions[v].downloadedAt).getTime()
    }))
    .sort((a, b) => {
      if (a.hasSuccess !== b.hasSuccess) return a.hasSuccess ? 1 : -1;
      return a.t - b.t;
    });
  if (remaining.length > CACHE_MAX_VERSIONS) {
    const toRemove = remaining.slice(0, remaining.length - CACHE_MAX_VERSIONS);
    for (const item of toRemove) {
      await removeVersionCache(meta, item.v);
      removedCount++;
    }
  }

  if (removedCount > 0) {
    await writeMeta(meta);
  }
  console.log('[CacheManager] cleanupExpired done, removed:', removedCount);
  return removedCount;
}

// ---------- Clear all cache immediately (settings page button) ---------- [立即清空全部缓存 (设置页按钮)]

export async function clearAllCache(): Promise<boolean> {
  const meta = await readMeta();
  const versions = Object.keys(meta.versions);
  for (const v of versions) {
    await removeVersionCache(meta, v);
  }
  meta.versions = {};
  await writeMeta(meta);
  console.log('[CacheManager] All cache cleared');
  return true;
}

/**
 * Delete cache for a specific version (finer-grained option for settings page, currently only full delete is used) [删除指定版本的缓存 (设置页更细粒度可选，目前只用全部删除)]
 */
export async function clearCacheByVersion(version: string): Promise<boolean> {
  const meta = await readMeta();
  if (!meta.versions[version]) return false;
  await removeVersionCache(meta, version);
  await writeMeta(meta);
  return true;
}

// ---------- Aggregate info (for settings page display) ---------- [聚合信息 (给设置页展示)]

/**
 * Get cache info of the "latest version" (settings page only shows the latest one) [取「最新的一个版本」的缓存信息 (设置页只展示最新的那一个)]
 * Reads meta then delegates to cache-info.ts for computation [读取 meta 后委托给 cache-info.ts 计算]
 * @param successRetentionDays Retention days after successful launch (7~30, from config; default 7 if omitted) [成功打开后的保留天数 (7~30，由配置传入；缺省用默认 7 天)]
 */
export async function getLatestCacheInfo(successRetentionDays?: number | null): Promise<CacheInfo> {
  const meta = await readMeta();
  return computeLatestCacheInfo(meta, successRetentionDays);
}
