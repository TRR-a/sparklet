// scripts/generate-manifest.js
// Pre-release script: generate both manifest files with all fields
// Usage: node scripts/generate-manifest.js v0.2.2

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const GITHUB_OWNER = 'TRR-a';
const GITHUB_REPO = 'sparklet';
const RELEASE_TAG = process.argv[2] || 'v0.2.2';

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

async function generateCurrentManifest(version, hash, internalCodename, description, license) {
  const manifest = {
    version: version.replace('v', ''), // 本地不带 v
    hash,
    internalCodename,
    description,
    license,
    releaseDate: new Date().toISOString()
  };
  const outputPath = path.join(__dirname, '..', 'manifest.current.json');
  await fs.writeJson(outputPath, manifest, { spaces: 2 });
  console.log('[Generate] Created manifest.current.json:', outputPath);
  return manifest;
}

async function generateReleasesManifest(entries) {
  const outputPath = path.join(__dirname, '..', 'manifest.releases.json');
  await fs.writeJson(outputPath, entries, { spaces: 2 });
  console.log('[Generate] Created manifest.releases.json:', outputPath);
  return entries;
}

async function readExistingReleases() {
  const filePath = path.join(__dirname, '..', 'manifest.releases.json');
  if (await fs.pathExists(filePath)) {
    const data = await fs.readJson(filePath);
    if (Array.isArray(data)) return data;
  }
  return [];
}

async function downloadAndHash(version) {
  const zipUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${version}/Sparklet-${version}.zip`;
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
  console.log('[Generate] File hash:', hash);
  return hash;
}

async function main() {
  const version = RELEASE_TAG.startsWith('v') ? RELEASE_TAG : `v${RELEASE_TAG}`;
  const versionNumber = version.replace('v', '');
  console.log('[Generate] Version:', version);
  
  // 获取项目信息
  const pkgInfo = getPackageInfo();
  
  // 下载更新包并计算哈希
  let hash;
  try {
    hash = await downloadAndHash(version);
  } catch (err) {
    console.error('[Generate] Download failed:', err.message);
    console.log('[Generate] Please ensure Sparklet-' + version + '.zip is uploaded to GitHub Releases');
    process.exit(1);
  }
  
  const url = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${version}/Sparklet-${version}.zip`;
  
  // 生成本地 manifest（不带 v）
  await generateCurrentManifest(
    versionNumber,
    hash,
    pkgInfo.internalCodename,
    pkgInfo.description,
    pkgInfo.license
  );
  
  // 生成/更新云端 manifest（带 v）
  const existing = await readExistingReleases();
  const existingIndex = existing.findIndex(item => item.version === version);
  const newEntry = {
    version: version,           // 带 v
    hash,
    internalCodename: pkgInfo.internalCodename,
    description: pkgInfo.description,
    license: pkgInfo.license,
    releaseDate: new Date().toISOString()
  };
  if (existingIndex >= 0) {
    existing[existingIndex] = newEntry;
  } else {
    existing.push(newEntry);
    // 按版本号降序（最新在前）
    existing.sort((a, b) => {
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
  await generateReleasesManifest(existing);
  
  console.log('[Generate] Done!');
  console.log('[Generate] Please upload manifest.releases.json as an asset to the GitHub Release');
}

main().catch(err => {
  console.error('[Generate] Execution failed:', err);
  process.exit(1);
});