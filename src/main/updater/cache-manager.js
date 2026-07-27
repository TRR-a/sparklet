// src/main/updater/cache-manager.js
// 更新包持久缓存管理：
// - 下载完 ZIP 后同步到 userData/update_cache/（长期保留，不随临时目录清理）
// - 缓存保留策略：成功打开过的版本保留 X 天（X 由用户配置，7~30，默认 7）；未成功使用的版本兜底 30 天；最多同时保留 2 个版本
// - 启动时自检失败 → 若缓存中有完好 ZIP，直接走回滚安装；若缓存 ZIP 损坏则删除并提示从官网下载
// - 设置页可手动查看缓存信息、立即删除缓存

const fs = require('fs-extra');
const path = require('path');
const {
  getUpdateCacheDir,
  getUpdateCacheMetaPath,
  DEFAULT_CACHE_SUCCESS_RETENTION_DAYS,
  CACHE_UNUSED_RETENTION_DAYS,
  CACHE_MAX_VERSIONS,
  PACKAGE_NAME_PATTERN
} = require('./constants');

/**
 * 缓存元数据结构：
 * {
 *   versions: {
 *     "v0.2.2": {
 *       version: "v0.2.2",
 *       zipFilename: "sparklet-v0.2.2-win-x86_64.zip",
 *       packageHash: "abc123...",     // 下载完成时记录，用于回滚前快速校验 ZIP 是否完好
 *       downloadedAt: "2026-08-04T10:00:00.000Z",
 *       successFirstLaunchAt: null    // 启动后延迟 30s 才写入（防秒崩）
 *     }
 *   }
 * }
 */

// ---------- 基础读写 ----------

/**
 * 确保缓存目录和 meta 文件存在
 */
async function ensureCacheReady() {
  const cacheDir = getUpdateCacheDir();
  await fs.ensureDir(cacheDir);
  const metaPath = getUpdateCacheMetaPath();
  if (!(await fs.pathExists(metaPath))) {
    await fs.writeJson(metaPath, { versions: {} }, { spaces: 2 });
  }
}

async function readMeta() {
  await ensureCacheReady();
  const metaPath = getUpdateCacheMetaPath();
  try {
    const data = await fs.readJson(metaPath);
    if (!data || typeof data !== 'object' || !data.versions) {
      return { versions: {} };
    }
    return data;
  } catch (err) {
    console.warn('[CacheManager] Failed to parse cache meta, resetting:', err.message);
    const fresh = { versions: {} };
    await fs.writeJson(metaPath, fresh, { spaces: 2 });
    return fresh;
  }
}

async function writeMeta(meta) {
  await ensureCacheReady();
  const metaPath = getUpdateCacheMetaPath();
  await fs.writeJson(metaPath, meta, { spaces: 2 });
}

// ---------- 缓存注册 / 同步 ----------

/**
 * 将下载完成的 ZIP 同步到持久缓存目录，并记录 meta
 * @param {string} srcZipPath  临时目录中刚下载好的 ZIP 路径
 * @param {string} version      版本号（如 "v0.2.2"）
 * @param {string} packageHash  已校验通过的 packageHash
 */
async function registerCachedZip(srcZipPath, version, packageHash) {
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
  // 若已有同名文件，先删再拷（避免半残文件）
  if (await fs.pathExists(destZipPath)) {
    await fs.remove(destZipPath);
  }
  await fs.copy(srcZipPath, destZipPath);

  const meta = await readMeta();
  meta.versions[version] = {
    version,
    zipFilename: srcFilename,
    packageHash: packageHash || null,
    downloadedAt: new Date().toISOString(),
    successFirstLaunchAt: null
  };

  // 超过最大保留数，先清理最老的（按 downloadedAt 升序删）
  const versionKeys = Object.keys(meta.versions);
  if (versionKeys.length > CACHE_MAX_VERSIONS) {
    const sorted = versionKeys
      .map(v => ({ v, t: new Date(meta.versions[v].downloadedAt).getTime() }))
      .sort((a, b) => a.t - b.t);
    const toRemove = sorted.slice(0, sorted.length - CACHE_MAX_VERSIONS);
    for (const item of toRemove) {
      await removeVersionCache(meta, item.v);
    }
  }

  await writeMeta(meta);
  console.log('[CacheManager] Registered cached zip:', version, '->', destZipPath);
  return destZipPath;
}

// ---------- 标记成功打开 ----------

/**
 * 标记某版本「第一次成功打开」时间（启动后延迟 30s 调用，防秒崩）
 */
async function markSuccessFirstLaunch(version) {
  const meta = await readMeta();
  if (!meta.versions[version]) {
    console.log('[CacheManager] markSuccessFirstLaunch: version not in cache, skip:', version);
    return false;
  }
  if (meta.versions[version].successFirstLaunchAt) {
    return true; // 已经标记过，不再重复写
  }
  meta.versions[version].successFirstLaunchAt = new Date().toISOString();
  await writeMeta(meta);
  console.log('[CacheManager] Marked successFirstLaunchAt for', version);
  return true;
}

// ---------- 获取某个版本的缓存 ZIP ----------

/**
 * 获取指定版本的缓存 ZIP 绝对路径（如果存在且 meta 中有记录）
 * 不做完整性校验，只返回路径；调用方可自行用 packageHash 校验
 */
async function getCachedZipPath(version) {
  const meta = await readMeta();
  const entry = meta.versions[version];
  if (!entry || !entry.zipFilename) return null;
  const zipPath = path.join(getUpdateCacheDir(), entry.zipFilename);
  const exists = await fs.pathExists(zipPath);
  if (!exists) return null;
  return zipPath;
}

/**
 * 快速检查缓存中指定版本的 ZIP 是否完好（对比 packageHash）
 * 返回 { ok, zipPath, packageHash }
 */
async function verifyCachedZip(version, computeSha256Fn) {
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
    return { ok: false, zipPath, reason: 'hash-error:' + err.message };
  }
}

// ---------- 删除单个版本缓存 ----------

async function removeVersionCache(meta, version) {
  const entry = meta.versions[version];
  if (entry && entry.zipFilename) {
    const zipPath = path.join(getUpdateCacheDir(), entry.zipFilename);
    try {
      if (await fs.pathExists(zipPath)) {
        await fs.remove(zipPath);
      }
    } catch (err) {
      console.warn('[CacheManager] Failed to remove cached zip:', zipPath, err.message);
    }
  }
  delete meta.versions[version];
}

// ---------- 清理过期缓存 ----------

/**
 * 根据保留策略清理过期缓存
 * - 有 successFirstLaunchAt：超过 7 天 → 删
 * - 没 successFirstLaunchAt：超过 30 天 → 删
 * - 超过 CACHE_MAX_VERSIONS：删最老的
 * @param {number} [successRetentionDays] 成功打开后的保留天数（7~30，由配置传入；缺省用默认 7 天）
 */
async function cleanupExpired(successRetentionDays) {
  const okDays = Number.isFinite(successRetentionDays) && successRetentionDays > 0
    ? successRetentionDays
    : DEFAULT_CACHE_SUCCESS_RETENTION_DAYS;

  const meta = await readMeta();
  const now = Date.now();
  const versionKeys = Object.keys(meta.versions);
  let removedCount = 0;

  // 第 1 轮：按时间删过期的
  for (const version of versionKeys) {
    const entry = meta.versions[version];
    if (!entry) continue;
    let expireMs;
    let baseline;
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

  // 第 2 轮：按数量上限删最老的
  const remaining = Object.keys(meta.versions)
    .map(v => ({ v, t: new Date(meta.versions[v].downloadedAt).getTime() }))
    .sort((a, b) => a.t - b.t);
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

// ---------- 立即清空全部缓存（设置页按钮）----------

async function clearAllCache() {
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
 * 删除指定版本的缓存（设置页更细粒度可选，目前只用全部删除）
 */
async function clearCacheByVersion(version) {
  const meta = await readMeta();
  if (!meta.versions[version]) return false;
  await removeVersionCache(meta, version);
  await writeMeta(meta);
  return true;
}

// ---------- 聚合信息（给设置页展示）----------

/**
 * 计算目录下单个 ZIP 的大小（字节）
 */
async function getFileSize(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.size || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * 取「最新的一个版本」的缓存信息（设置页只展示最新的那一个）
 * @param {number} [successRetentionDays] 成功打开后的保留天数（7~30，由配置传入；缺省用默认 7 天）
 * 返回：
 * {
 *   hasCache: boolean,
 *   version: string | null,
 *   zipFilename: string | null,
 *   sizeBytes: number,
 *   sizeFormatted: string,
 *   downloadedAt: ISO string | null,
 *   successFirstLaunchAt: ISO string | null,
 *   retentionStrategy: string | null,     // 例如 'success-14d' / 'unused-30d'
 *   retentionDays: number | null,         // 当前策略对应的总保留天数（供前端显示用）
 *   remainingDays: number | null,         // 还剩多少天自动删除（小数，如 3.5）；null 表示无法计算
 *   totalCachedVersions: number
 * }
 */
async function getLatestCacheInfo(successRetentionDays) {
  const okDays = Number.isFinite(successRetentionDays) && successRetentionDays > 0
    ? successRetentionDays
    : DEFAULT_CACHE_SUCCESS_RETENTION_DAYS;

  const meta = await readMeta();
  const versions = Object.keys(meta.versions);
  if (versions.length === 0) {
    return {
      hasCache: false,
      version: null,
      zipFilename: null,
      sizeBytes: 0,
      sizeFormatted: formatBytes(0),
      downloadedAt: null,
      successFirstLaunchAt: null,
      retentionStrategy: null,
      retentionDays: null,
      remainingDays: null,
      totalCachedVersions: 0
    };
  }

  // 按 downloadedAt 降序取最新的
  const sorted = versions
    .map(v => ({ v, entry: meta.versions[v] }))
    .sort((a, b) => new Date(b.entry.downloadedAt).getTime() - new Date(a.entry.downloadedAt).getTime());
  const latest = sorted[0];
  const entry = latest.entry;

  const zipPath = path.join(getUpdateCacheDir(), entry.zipFilename);
  const sizeBytes = await getFileSize(zipPath);

  const now = Date.now();
  let retentionStrategy = null;
  let retentionDays = null;
  let remainingDays = null;
  if (entry.successFirstLaunchAt) {
    retentionStrategy = `success-${okDays}d`;
    retentionDays = okDays;
    const baseline = new Date(entry.successFirstLaunchAt).getTime();
    const elapsedMs = now - baseline;
    const totalMs = okDays * 24 * 60 * 60 * 1000;
    remainingDays = Math.max(0, (totalMs - elapsedMs) / (24 * 60 * 60 * 1000));
  } else {
    retentionStrategy = `unused-${CACHE_UNUSED_RETENTION_DAYS}d`;
    retentionDays = CACHE_UNUSED_RETENTION_DAYS;
    const baseline = new Date(entry.downloadedAt).getTime();
    const elapsedMs = now - baseline;
    const totalMs = CACHE_UNUSED_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    remainingDays = Math.max(0, (totalMs - elapsedMs) / (24 * 60 * 60 * 1000));
  }

  return {
    hasCache: true,
    version: entry.version,
    zipFilename: entry.zipFilename,
    sizeBytes,
    sizeFormatted: formatBytes(sizeBytes),
    downloadedAt: entry.downloadedAt,
    successFirstLaunchAt: entry.successFirstLaunchAt,
    retentionStrategy,
    retentionDays,
    remainingDays,
    totalCachedVersions: versions.length
  };
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

module.exports = {
  ensureCacheReady,
  readMeta,
  writeMeta,
  registerCachedZip,
  markSuccessFirstLaunch,
  getCachedZipPath,
  verifyCachedZip,
  cleanupExpired,
  clearAllCache,
  clearCacheByVersion,
  getLatestCacheInfo
};
