// src/main/updater/verify.js
// Two-layer verification: manifest integrity + SHA256

const crypto = require('crypto');
const fs = require('fs-extra');
const { fetchReleasesManifest, readCurrentManifest } = require('./manifest-helper');

async function computeSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * 第一层校验：从 manifest.releases.json 获取目标版本的完整信息
 * @param {string} manifestUrl manifest.releases.json 下载地址
 * @param {string} targetVersion 目标版本号（带 'v'，如 "v0.2.3"）
 * @returns {Promise<{ success: boolean, entry: Object | null, error: string | null }>}
 */
async function verifyReleaseManifest(manifestUrl, targetVersion) {
  console.log('[Verify] Layer 1: Fetching manifest.releases.json');
  const releases = await fetchReleasesManifest(manifestUrl);
  if (!releases) {
    return { success: false, entry: null, error: 'Unable to fetch manifest.releases.json' };
  }
  const targetEntry = releases.find(item => item.version === targetVersion);
  if (!targetEntry) {
    return {
      success: false,
      entry: null,
      error: `Version ${targetVersion} not found in manifest`
    };
  }
  // 检查 hash 字段是否存在（用于后续校验）
  if (!targetEntry.hash) {
    return {
      success: false,
      entry: null,
      error: `Version ${targetVersion} manifest entry missing hash`
    };
  }
  console.log('[Verify] Layer 1 passed, entry:', {
    version: targetEntry.version,
    hash: targetEntry.hash ? targetEntry.hash.slice(0, 16) + '...' : 'missing',
    internalCodename: targetEntry.internalCodename || 'N/A'
  });
  return { success: true, entry: targetEntry, error: null };
}

/**
 * 第二层校验：验证下载的更新包 SHA256 是否与预期一致
 * @param {string} zipPath 下载的 zip 文件路径
 * @param {string} expectedHash 预期的 SHA256 哈希
 * @returns {Promise<{ success: boolean, error: string | null }>}
 */
async function verifyPackageIntegrity(zipPath, expectedHash) {
  console.log('[Verify] Layer 2: Computing SHA256 of downloaded package');
  try {
    const exists = await fs.pathExists(zipPath);
    if (!exists) {
      return { success: false, error: 'Downloaded package file not found' };
    }
    const actualHash = await computeSha256(zipPath);
    console.log('[Verify] Actual hash:', actualHash.slice(0, 16) + '...');
    console.log('[Verify] Expected hash:', expectedHash.slice(0, 16) + '...');
    if (actualHash !== expectedHash) {
      return {
        success: false,
        error: `SHA256 mismatch: expected ${expectedHash}, got ${actualHash}`
      };
    }
    console.log('[Verify] Layer 2 passed');
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: `Verification error: ${err.message}` };
  }
}

/**
 * 启动时完整性自检：检查当前应用核心文件是否被篡改
 * 使用 manifest.current.json 中的 hash 字段
 * @returns {Promise<{ success: boolean, error: string | null }>}
 */
async function selfCheckIntegrity() {
  console.log('[Verify] Running startup integrity self-check');
  const currentManifest = await readCurrentManifest();
  if (!currentManifest) {
    console.warn('[Verify] No manifest.current.json found, skipping self-check');
    return { success: true, error: null };
  }
  // 检查是否有 hash 字段
  if (!currentManifest.hash) {
    console.warn('[Verify] manifest.current.json missing hash field, skipping self-check');
    return { success: true, error: null };
  }
  const mainIndexPath = require('path').join(require('./constants').getAppRoot(), 'src/main/index.js');
  try {
    const exists = await fs.pathExists(mainIndexPath);
    if (!exists) {
      console.warn('[Verify] Main entry file not found, skipping self-check');
      return { success: true, error: null };
    }
    const actualHash = await computeSha256(mainIndexPath);
    if (actualHash !== currentManifest.hash) {
      return {
        success: false,
        error: 'Integrity check failed: application files may be corrupted or tampered'
      };
    }
    console.log('[Verify] Integrity self-check passed');
    return { success: true, error: null };
  } catch (err) {
    console.error('[Verify] Self-check error:', err.message);
    return { success: true, error: null };
  }
}

module.exports = {
  computeSha256,
  verifyReleaseManifest,
  verifyPackageIntegrity,
  selfCheckIntegrity
};