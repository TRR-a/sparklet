// src/main/updater/manifest-helper.js
// Manifest file reading and parsing (full object, no field validation)

const fs = require('fs-extra');
const path = require('path');
const { getAppRoot } = require('./constants');

/**
 * 读取随应用打包的 manifest.current.json
 * @returns {Promise<Object | null>} 完整对象，或 null（文件不存在/解析失败）
 */
async function readCurrentManifest() {
  const manifestPath = path.join(getAppRoot(), 'manifest.current.json');
  try {
    const exists = await fs.pathExists(manifestPath);
    if (!exists) {
      console.warn('[ManifestHelper] manifest.current.json not found');
      return null;
    }
    const content = await fs.readFile(manifestPath, 'utf-8');
    const data = JSON.parse(content);
    // 直接返回完整对象，不做字段校验
    return data;
  } catch (err) {
    console.error('[ManifestHelper] Read manifest.current.json failed:', err.message);
    return null;
  }
}

/**
 * 从 GitHub 下载 manifest.releases.json
 * @param {string} downloadUrl 附件下载地址
 * @returns {Promise<Array<Object> | null>} 完整对象数组，或 null
 */
async function fetchReleasesManifest(downloadUrl) {
  const https = require('https');
  const { URL } = require('url');
  return new Promise((resolve) => {
    const urlObj = new URL(downloadUrl);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: { 'User-Agent': 'Sparklet-Updater', 'Accept': 'application/json' },
      timeout: 10000
    };
    const req = https.get(options, (res) => {
      if (res.statusCode !== 200) {
        console.error('[ManifestHelper] Fetch manifest failed, status:', res.statusCode);
        resolve(null);
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            console.warn('[ManifestHelper] Invalid manifest format, expecting non-empty array');
            resolve(null);
            return;
          }
          // 直接返回完整数组，不做字段校验
          resolve(parsed);
        } catch (err) {
          console.error('[ManifestHelper] Parse manifest failed:', err.message);
          resolve(null);
        }
      });
    });
    req.on('error', (err) => {
      console.error('[ManifestHelper] Request error:', err.message);
      resolve(null);
    });
    req.on('timeout', () => {
      req.destroy();
      console.error('[ManifestHelper] Request timeout');
      resolve(null);
    });
  });
}

/**
 * 从 GitHub Release 数据中提取 asset 下载地址
 * @param {Object} releaseData GitHub API 返回的 release 数据
 * @returns {{ zipUrl: string | null, manifestUrl: string | null, tagName: string | null }}
 */
function extractAssetsFromRelease(releaseData) {
  if (!releaseData || !releaseData.assets || !Array.isArray(releaseData.assets)) {
    return { zipUrl: null, manifestUrl: null, tagName: null };
  }
  const tagName = releaseData.tag_name || null;
  let zipUrl = null, manifestUrl = null;
  for (const asset of releaseData.assets) {
    const name = asset.name || '';
    if (name === 'manifest.releases.json') {
      manifestUrl = asset.browser_download_url || null;
    } else if (name.match(/^Sparklet-v\d+\.\d+\.\d+\.zip$/)) {
      zipUrl = asset.browser_download_url || null;
    }
  }
  return { zipUrl, manifestUrl, tagName };
}

module.exports = {
  readCurrentManifest,
  fetchReleasesManifest,
  extractAssetsFromRelease
};