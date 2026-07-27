// scripts/generate-manifest.js
// Pre-release script: generate both manifest files with multi-hash fields
// Usage (可以分开多次调用，不会互相覆盖未涉及的字段):
//   Phase 1 - 生成 exeHash + filesHash（pack 之后、拷入 manifest 到 win-unpacked 之前）:
//     node scripts/generate-manifest.js v0.2.2 --exe ./path/to/Sparklet.exe --files ./path/to/win-unpacked
//   Phase 2 - 追加 packageHash（zip 生成之后）:
//     node scripts/generate-manifest.js v0.2.2 --zip ./path/to/sparklet-v0.2.2-win-x86_64.zip
//   旧用法（只给 exe，兼容旧模式，会把 exeHash 同时写入旧 hash 字段）:
//     node scripts/generate-manifest.js v0.2.2 --exe ./path/to/Sparklet.exe
//   下载 ZIP 后算 packageHash（从 GitHub 下载，再算 hash）:
//     node scripts/generate-manifest.js v0.2.2

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const GITHUB_OWNER = 'TRR-a';
const GITHUB_REPO = 'sparklet';
const RELEASE_TAG = process.argv[2] || 'v0.2.2';

// ========== 完整性校验：黑名单（从共享规则引入，保证与运行端 constants.js 100% 一致）==========
const {
  INTEGRITY_FILENAME_BLACKLIST,
  INTEGRITY_EXTENSION_BLACKLIST,
  isExcludedFromIntegrity
} = require('../src/main/updater/_integrity-rules');

// 从 package.json 读取内部代号、描述、许可证等信息
function getPackageInfo() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = require(pkgPath);
  return {
    internalCodename: pkg.internalCodename || 'Unknown',
    description: pkg.description || 'Sparklet',
    license: pkg.license || 'MIT'
  };
}

function computeSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * 递归收集目录下所有文件（排除精确文件名黑名单 + 扩展名黑名单）
 * 和运行端 verify.js collectAllFiles 用同一个 isExcludedFromIntegrity 过滤，保证规则一致
 */
async function collectAllFiles(dir, fileList) {
  const items = await fs.readdir(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      await collectAllFiles(fullPath, fileList);
    } else {
      // 精确文件名 + 扩展名双重过滤（.log/.dmp/.tmp 等不参与 filesHash）
      if (isExcludedFromIntegrity(item)) {
        continue;
      }
      fileList.push(fullPath);
    }
  }
}

/**
 * 计算多个文件的组合哈希（按路径排序后拼接内容再算 SHA256）
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

async function downloadAndHash(version) {
  const zipUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${version}/sparklet-${version}-win-x86_64.zip`;
  const tempPath = path.join(__dirname, '..', 'temp-download.zip');
  console.log('[Generate] Downloading:', zipUrl);
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(tempPath);
    https.get(zipUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed, status: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', resolve);
      file.on('error', reject);
    }).on('error', reject);
  });
  const hash = await computeSha256(tempPath);
  await fs.remove(tempPath);
  console.log('[Generate] Downloaded package hash:', hash);
  return hash;
}

/**
 * 读取已存在的 manifest.current.json（如果有），用来保留之前生成的字段
 */
async function readExistingCurrent() {
  const filePath = path.join(__dirname, '..', 'manifest.current.json');
  if (await fs.pathExists(filePath)) {
    try {
      return await fs.readJson(filePath);
    } catch (e) {
      console.warn('[Generate] Failed to parse existing manifest.current.json, starting fresh');
    }
  }
  return {};
}

async function readExistingReleases() {
  const filePath = path.join(__dirname, '..', 'manifest.releases.json');
  if (await fs.pathExists(filePath)) {
    const data = await fs.readJson(filePath);
    if (Array.isArray(data)) return data;
  }
  return [];
}

async function writeCurrentManifest(fields) {
  const outputPath = path.join(__dirname, '..', 'manifest.current.json');
  await fs.writeJson(outputPath, fields, { spaces: 2 });
  console.log('[Generate] Updated manifest.current.json:', outputPath);
}

async function writeReleasesManifest(entries) {
  const outputPath = path.join(__dirname, '..', 'manifest.releases.json');
  await fs.writeJson(outputPath, entries, { spaces: 2 });
  console.log('[Generate] Updated manifest.releases.json:', outputPath);
}

async function main() {
  const version = RELEASE_TAG.startsWith('v') ? RELEASE_TAG : `v${RELEASE_TAG}`;
  const versionNumber = version.replace('v', '');
  console.log('[Generate] Version:', version);

  // 解析命令行参数
  const args = process.argv.slice(3);
  const getArg = (name) => {
    const idx = args.indexOf(name);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
    return null;
  };
  const exePath = getArg('--exe');
  const filesDir = getArg('--files');
  const zipPath = getArg('--zip');

  // 读取已有 manifest（保留之前生成的其他 hash 字段）
  const current = await readExistingCurrent();
  const releases = await readExistingReleases();
  const pkgInfo = getPackageInfo();

  // ========== 计算 exeHash ==========
  if (exePath) {
    console.log('[Generate] Computing exe SHA256:', exePath);
    try {
      const exists = await fs.pathExists(exePath);
      if (!exists) {
        console.error('[Generate] Exe file not found:', exePath);
        process.exit(1);
      }
      const exeHash = await computeSha256(exePath);
      current.exeHash = exeHash;
      // 兼容旧格式：同时写入 hash 字段（用 exeHash 兜底）
      current.hash = exeHash;
      console.log('[Generate] exeHash:', exeHash);
    } catch (err) {
      console.error('[Generate] Failed to compute exe hash:', err.message);
      process.exit(1);
    }
  }

  // ========== 计算 filesHash（win-unpacked 全目录的 combinedHash，排除黑名单文件）==========
  if (filesDir) {
    console.log('[Generate] Computing files combinedHash from:', filesDir);
    try {
      const exists = await fs.pathExists(filesDir);
      if (!exists) {
        console.error('[Generate] Files directory not found:', filesDir);
        console.error('[Generate] Hint: --files should point to win-unpacked directory (full unpacked app dir), e.g.');
        console.error('           release/v0.2.2/win-unpacked');
        process.exit(1);
      }
      const files = [];
      await collectAllFiles(filesDir, files);
      if (files.length === 0) {
        console.error('[Generate] No files found in:', filesDir);
        process.exit(1);
      }
      const filesHash = await computeCombinedHash(files);
      current.filesHash = filesHash;
      console.log(`[Generate] filesHash (${files.length} files, exclude ${[...INTEGRITY_FILENAME_BLACKLIST].join('/')} + exts ${[...INTEGRITY_EXTENSION_BLACKLIST].join(' ')}):`, filesHash);
    } catch (err) {
      console.error('[Generate] Failed to compute files hash:', err.message);
      process.exit(1);
    }
  }

  // ========== 计算 packageHash（最终 ZIP 的 SHA256）==========
  let packageHash = null;
  if (zipPath) {
    console.log('[Generate] Computing package SHA256:', zipPath);
    try {
      const exists = await fs.pathExists(zipPath);
      if (!exists) {
        console.error('[Generate] Zip file not found:', zipPath);
        process.exit(1);
      }
      packageHash = await computeSha256(zipPath);
      current.packageHash = packageHash;
      console.log('[Generate] packageHash:', packageHash);
    } catch (err) {
      console.error('[Generate] Failed to compute package hash:', err.message);
      process.exit(1);
    }
  } else if (!exePath && !filesDir) {
    // 没有 --exe / --files / --zip 任何一个参数 → 走旧逻辑：下载 GitHub ZIP 算 packageHash
    console.log('[Generate] No --exe/--files/--zip provided, trying to download from GitHub Releases...');
    try {
      packageHash = await downloadAndHash(version);
      current.packageHash = packageHash;
      if (!current.hash) current.hash = packageHash;
    } catch (err) {
      console.error('[Generate] Download failed:', err.message);
      console.log('[Generate] Hint: if ZIP is not yet uploaded, run with --zip after generating the zip, e.g.');
      console.log('           node scripts/generate-manifest.js v0.2.2 --zip ./release/v0.2.2/sparklet-v0.2.2-win-x86_64.zip');
      process.exit(1);
    }
  }

  // ========== 填充其他字段（只在缺失时写入，不覆盖已有的）==========
  if (!current.version) current.version = versionNumber;
  if (!current.internalCodename) current.internalCodename = pkgInfo.internalCodename;
  if (!current.description) current.description = pkgInfo.description;
  if (!current.license) current.license = pkgInfo.license;
  if (!current.releaseDate) current.releaseDate = new Date().toISOString();

  await writeCurrentManifest(current);

  // ========== 同步/追加 manifest.releases.json 的对应 entry ==========
  const existingIndex = releases.findIndex(item => item.version === version);
  const newEntry = {};
  if (existingIndex >= 0) {
    // 合并已有字段，不丢失以前的其他 hash
    Object.assign(newEntry, releases[existingIndex]);
  }
  newEntry.version = version;
  newEntry.internalCodename = pkgInfo.internalCodename;
  newEntry.description = pkgInfo.description;
  newEntry.license = pkgInfo.license;
  newEntry.releaseDate = new Date().toISOString();
  // 逐个同步 hash 字段（有就写，没有就保留旧值）
  if (current.packageHash) newEntry.packageHash = current.packageHash;
  if (current.exeHash)     newEntry.exeHash     = current.exeHash;
  if (current.filesHash)   newEntry.filesHash   = current.filesHash;
  // 兼容旧格式：用 packageHash 兜底 hash 字段（更新场景最常用的是 packageHash）
  if (current.packageHash) newEntry.hash = current.packageHash;
  else if (current.exeHash) newEntry.hash = current.exeHash;
  else if (current.hash) newEntry.hash = current.hash;

  if (existingIndex >= 0) {
    releases[existingIndex] = newEntry;
  } else {
    releases.push(newEntry);
    releases.sort((a, b) => {
      const va = a.version.replace('v', '').split('.').map(Number);
      const vb = b.version.replace('v', '').split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if ((va[i] || 0) !== (vb[i] || 0)) {
          return (vb[i] || 0) - (va[i] || 0);
        }
      }
      return 0;
    });
  }
  await writeReleasesManifest(releases);

  console.log('[Generate] Done! Summary:');
  console.log('  version        :', current.version);
  console.log('  exeHash        :', current.exeHash     ? current.exeHash.slice(0, 16) + '...'     : '(not set)');
  console.log('  packageHash    :', current.packageHash ? current.packageHash.slice(0, 16) + '...' : '(not set)');
  console.log('  filesHash      :', current.filesHash   ? current.filesHash.slice(0, 16) + '...'   : '(not set)');
  console.log('[Generate] Upload manifest.releases.json as a GitHub Release asset');
  console.log('[Generate] manifest.current.json is already placed for distribution (copy to win-unpacked/)');
}

main().catch(err => {
  console.error('[Generate] Execution failed:', err);
  process.exit(1);
});
