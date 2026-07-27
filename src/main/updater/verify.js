// src/main/updater/verify.js
// Two-layer verification: manifest integrity + SHA256

const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const { fetchReleasesManifest, readCurrentManifest } = require('./manifest-helper');
const { isExcludedFromIntegrity } = require('./constants');

/**
 * 规范化版本号：统一去掉 v 前缀后再比较，避免 "v0.2.2" 和 "0.2.2" 不匹配
 */
function normalizeVersion(v) {
  if (!v) return '';
  return String(v).replace(/^v/i, '').trim();
}

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
 * 从 entry 中提取指定 hash 字段。
 * ⚠️ 语义隔离原则：不同 hash 字段语义不同，禁止跨字段兜底导致 100% 误报。
 * 三校验场景：
 *   - packageHash：ZIP 安装包完整性（下载后校验）    ← 可以 fallback 到旧 hash 字段（老版本 hash 存的就是 ZIP hash）
 *   - exeHash：Sparklet.exe 完整性（启动时自检）     ← 禁止 fallback，没有就跳过校验
 *   - filesHash：解压后全部文件完整性（启动时自检）   ← 禁止 fallback，没有就跳过校验
 */
function getHashField(entry, fieldName) {
  if (!entry) return null;
  if (entry[fieldName]) return entry[fieldName];
  // 只有 packageHash ↔ 旧 entry.hash 可以互相兜底（语义一致，都是 ZIP 级别 / 老版本单一 hash）
  if (fieldName === 'packageHash') return entry.hash || null;
  // filesHash 和 exeHash 不允许 fallback 到 entry.hash（99% 情况下 entry.hash 存的是 packageHash/ZIP 的 hash）
  // 否则会把 ZIP 的 hash 拿去和「解压后全部文件组合 hash」或「单 exe hash」比较，必然不相等 → 每次启动误报
  return null;
}

/**
 * 第一层校验：从 manifest.releases.json 获取目标版本的完整信息
 */
async function verifyReleaseManifest(manifestUrl, targetVersion) {
  console.log('[Verify] Layer 1: Fetching manifest.releases.json');
  const releases = await fetchReleasesManifest(manifestUrl);
  if (!releases) {
    return { success: false, entry: null, error: 'Unable to fetch manifest.releases.json' };
  }
  const targetEntry = releases.find(item =>
    normalizeVersion(item.version) === normalizeVersion(targetVersion)
  );
  if (!targetEntry) {
    return {
      success: false,
      entry: null,
      error: `Version ${targetVersion} not found in manifest`
    };
  }
  const hasAnyHash = targetEntry.packageHash || targetEntry.exeHash || targetEntry.filesHash || targetEntry.hash;
  if (!hasAnyHash) {
    return {
      success: false,
      entry: null,
      error: `Version ${targetVersion} manifest entry missing all hash fields`
    };
  }
  console.log('[Verify] Layer 1 passed, entry:', {
    version: targetEntry.version,
    packageHash: targetEntry.packageHash ? targetEntry.packageHash.slice(0, 16) + '...' : (targetEntry.hash ? targetEntry.hash.slice(0, 16) + '...' : 'missing'),
    internalCodename: targetEntry.internalCodename || 'N/A'
  });
  return { success: true, entry: targetEntry, error: null };
}

/**
 * 第二层校验：验证下载的更新包 SHA256 是否与预期一致
 * 优先用 entry.packageHash，回退到 entry.hash
 */
async function verifyPackageIntegrity(zipPath, entry) {
  const expectedHash = getHashField(entry, 'packageHash');
  console.log('[Verify] Layer 2: Computing SHA256 of downloaded package');
  try {
    if (!expectedHash) {
      console.warn('[Verify] packageHash missing, skipping package integrity check');
      return { success: true, error: null };
    }
    const exists = await fs.pathExists(zipPath);
    if (!exists) {
      return { success: false, error: 'Downloaded package file not found' };
    }
    const actualHash = await computeSha256(zipPath);
    console.log('[Verify] Actual package hash:', actualHash.slice(0, 16) + '...');
    console.log('[Verify] Expected package hash:', expectedHash.slice(0, 16) + '...');
    if (actualHash !== expectedHash) {
      return {
        success: false,
        error: `Package SHA256 mismatch: expected ${expectedHash}, got ${actualHash}`
      };
    }
    console.log('[Verify] Layer 2 passed');
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: `Verification error: ${err.message}` };
  }
}

/**
 * 启动时完整性自检：校验当前运行的 exe 文件是否被篡改
 * 使用外挂的 manifest.current.json（与 exe 同目录）
 * 优先用 exeHash，回退到 hash
 */
async function selfCheckIntegrity() {
  console.log('[Verify] Running startup integrity self-check');

  const { app } = require('electron');
  if (!app.isPackaged) {
    console.log('[Verify] Development environment, skipping self-check');
    return { success: true, error: null };
  }

  const exeDir = path.dirname(process.execPath);
  const appRoot = require('./constants').getAppRoot();
  // 优先读 exe 目录（用户安装目录），其次读 appRoot（installer 写入的位置）
  const candidatePaths = [
    path.join(exeDir, 'manifest.current.json'),
    path.join(appRoot, 'manifest.current.json')
  ];

  let currentManifest = null;
  for (const manifestPath of candidatePaths) {
    try {
      const exists = await fs.pathExists(manifestPath);
      if (!exists) continue;
      const content = await fs.readFile(manifestPath, 'utf-8');
      currentManifest = JSON.parse(content);
      console.log('[Verify] Loaded manifest.current.json from:', manifestPath);
      break;
    } catch (err) {
      console.warn('[Verify] Failed to read manifest.current.json at', manifestPath, ':', err.message);
    }
  }

  if (!currentManifest) {
    console.warn('[Verify] manifest.current.json not found, skipping self-check');
    return { success: true, error: null };
  }

  const expectedExeHash = getHashField(currentManifest, 'exeHash');
  if (!expectedExeHash) {
    console.warn('[Verify] manifest.current.json missing exeHash/hash field, skipping self-check');
    return { success: true, error: null };
  }

  try {
    const currentExePath = process.execPath;
    const exists = await fs.pathExists(currentExePath);
    if (!exists) {
      console.warn('[Verify] Current exe file not found, skipping self-check');
      return { success: true, error: null };
    }

    const actualHash = await computeSha256(currentExePath);
    if (actualHash !== expectedExeHash) {
      return {
        success: false,
        error: `Integrity check failed: executable file hash mismatch`
      };
    }

    console.log('[Verify] Integrity self-check passed');
    return { success: true, error: null };
  } catch (err) {
    console.error('[Verify] Self-check error:', err.message);
    return { success: true, error: null };
  }
}

/**
 * 校验已安装的文件完整性（启动时调用）
 * 默认启用，扫描 appRoot 全目录下所有文件（排除 manifest 文件黑名单）
 * 优先用 filesHash，回退到 hash（兼容旧格式）
 * 数据源优先级：云端 manifest.releases.json → 本地 manifest.current.json → 跳过
 */
async function verifyInstalledFiles(currentVersion, onProgress = null) {
  const errors = [];
  const { app } = require('electron');
  const { getInstallRoot } = require('./constants');
  // 用安装根目录（exe 所在目录）做扫描根，和打包端 --files win-unpacked/ 范围一致
  const appRoot = getInstallRoot();

  // 开发环境跳过校验
  if (!app.isPackaged) {
    console.log('[Verify] Development environment, skipping installed files check');
    return { success: true, errors: [] };
  }

  // 读取配置，检查是否启用完整性校验
  try {
    const { getConfigItem } = require('./config-manager');
    const enabled = await getConfigItem('integrityCheck');
    if (enabled === false) {
      console.log('[Verify] Integrity check disabled by user');
      return { success: true, errors: [] };
    }
  } catch (err) {
    console.log('[Verify] Config read failed, using default (enabled)');
  }

  onProgress && onProgress('正在校验应用文件完整性...', 0);

  // 获取预期的 filesHash（云端优先，本地兜底）
  let expectedFilesHash = null;
  let hashSource = null;

  try {
    const { fetchReleasesManifest } = require('./manifest-helper');
    const manifestUrl = `https://github.com/TRR-a/sparklet/releases/download/v${currentVersion}/manifest.releases.json`;
    const releases = await fetchReleasesManifest(manifestUrl);
    if (releases && Array.isArray(releases)) {
      const targetEntry = releases.find(item =>
        normalizeVersion(item.version) === normalizeVersion(currentVersion)
      );
      const fHash = getHashField(targetEntry, 'filesHash');
      if (fHash) {
        expectedFilesHash = fHash;
        hashSource = 'cloud';
        console.log('[Verify] Using cloud manifest for files integrity check');
      }
    }
  } catch (err) {
    console.log('[Verify] Cloud manifest fetch failed:', err.message);
  }

  if (!expectedFilesHash) {
    try {
      const { readCurrentManifest } = require('./manifest-helper');
      const localManifest = await readCurrentManifest();
      const fHash = getHashField(localManifest, 'filesHash');
      if (fHash) {
        expectedFilesHash = fHash;
        hashSource = 'local';
        console.log('[Verify] Using local manifest for files integrity check');
      }
    } catch (err) {
      console.log('[Verify] Local manifest read failed:', err.message);
    }
  }

  if (!expectedFilesHash) {
    console.warn('[Verify] No filesHash source available, skipping installed files check');
    return { success: true, errors: [] };
  }

  onProgress && onProgress('正在计算文件哈希...', 30);

  try {
    const exists = await fs.pathExists(appRoot);
    if (!exists) {
      errors.push(`应用根目录不存在: ${appRoot}`);
      return { success: false, errors };
    }

    const files = [];
    await collectAllFiles(appRoot, files);

    if (files.length === 0) {
      errors.push('未找到任何应用文件');
      return { success: false, errors };
    }

    onProgress && onProgress(`正在校验 ${files.length} 个文件...`, 60);

    const combinedHash = await computeCombinedHash(files);

    if (combinedHash !== expectedFilesHash) {
      errors.push(`文件完整性校验失败: 期望 ${expectedFilesHash.slice(0, 16)}...，实际 ${combinedHash.slice(0, 16)}...`);
      return { success: false, errors };
    }

    onProgress && onProgress('✅ 文件完整性校验通过', 100);
    console.log('[Verify] Installed files integrity check passed (source:', hashSource, ',', files.length, 'files)');
    return { success: true, errors: [] };

  } catch (err) {
    console.error('[Verify] Integrity check error:', err);
    errors.push(`校验过程出错: ${err.message}`);
    return { success: false, errors };
  }
}

/**
 * 递归收集目录下所有文件（排除精确文件名黑名单 + 扩展名黑名单）
 * 生成端和运行端统一用 isExcludedFromIntegrity 过滤，保证规则一致
 */
async function collectAllFiles(dir, fileList) {
  const items = await fs.readdir(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      await collectAllFiles(fullPath, fileList);
    } else {
      // 精确文件名 + 扩展名双重过滤（.log/.dmp/.tmp 等临时/崩溃文件一律不参与 hash）
      if (isExcludedFromIntegrity(item)) {
        continue;
      }
      fileList.push(fullPath);
    }
  }
}

/**
 * 计算多个文件的组合哈希（按路径排序后拼接内容）
 */
async function computeCombinedHash(filePaths) {
  const hash = crypto.createHash('sha256');
  const sorted = filePaths.slice().sort();
  for (const filePath of sorted) {
    const content = await fs.readFile(filePath);
    hash.update(content);
  }
  return hash.digest('hex');
}

module.exports = {
  computeSha256,
  verifyReleaseManifest,
  verifyPackageIntegrity,
  selfCheckIntegrity,
  verifyInstalledFiles,
  collectAllFiles,
  computeCombinedHash
};