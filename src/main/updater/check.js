// src/main/updater/check.js
// Version check: fetch GitHub release, compare versions

const https = require('https');
const { URL } = require('url');
const { GITHUB_API_URL, REQUEST_TIMEOUT_MS, classifyNetworkError } = require('./constants');
const { readCurrentManifest, extractAssetsFromRelease } = require('./manifest-helper');

function getCurrentVersion() {
  const pkg = require('../../../package.json');
  return pkg.version || '0.0.0';
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

async function fetchLatestRelease() {
  return new Promise((resolve) => {
    const urlObj = new URL(GITHUB_API_URL);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Sparklet-Updater',
        'Accept': 'application/vnd.github.v3+json'
      },
      timeout: REQUEST_TIMEOUT_MS
    };
    const req = https.get(options, (res) => {
      if (res.statusCode === 403) {
        const remaining = res.headers['x-ratelimit-remaining'];
        if (remaining === '0') {
          const errMsg = 'GitHub API rate limit exceeded, please try later';
          resolve({
            success: false,
            data: null,
            error: errMsg,
            errorType: classifyNetworkError(errMsg)
          });
          return;
        }
      }
      if (res.statusCode !== 200) {
        const errMsg = `GitHub API error: status ${res.statusCode}`;
        resolve({
          success: false,
          data: null,
          error: errMsg,
          errorType: classifyNetworkError(errMsg)
        });
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ success: true, data: parsed, error: null, errorType: null });
        } catch (err) {
          const errMsg = 'Failed to parse GitHub API response';
          resolve({
            success: false,
            data: null,
            error: errMsg,
            errorType: classifyNetworkError(errMsg)
          });
        }
      });
    });
    req.on('error', (err) => {
      const errMsg = `Network error: ${err.message}`;
      resolve({
        success: false,
        data: null,
        error: errMsg,
        errorType: classifyNetworkError(errMsg)
      });
    });
    req.on('timeout', () => {
      req.destroy();
      const errMsg = 'Request timeout';
      resolve({
        success: false,
        data: null,
        error: errMsg,
        errorType: classifyNetworkError(errMsg)
      });
    });
  });
}

async function checkForUpdates() {
  const currentVersion = getCurrentVersion();
  console.log('[UpdateCheck] Current version:', currentVersion);
  const { success, data, error, errorType: fetchErrorType } = await fetchLatestRelease();
  if (!success) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: null,
      zipUrl: null,
      manifestUrl: null,
      error,
      errorType: fetchErrorType || classifyNetworkError(error)
    };
  }
  const latestTag = data.tag_name || '';
  const latestVersion = latestTag.startsWith('v') ? latestTag.slice(1) : latestTag;
  const { zipUrl, manifestUrl } = extractAssetsFromRelease(data);

  if (!latestTag.startsWith('v')) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion,
      zipUrl: null,
      manifestUrl: null,
      error: `Invalid tag format: ${latestTag} does not start with 'v'`,
      errorType: 'unknown'
    };
  }
  const versionPattern = /^v\d+\.\d+\.\d+$/;
  if (!versionPattern.test(latestTag)) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion,
      zipUrl: null,
      manifestUrl: null,
      error: `Invalid tag format: ${latestTag} does not match vX.X.X`,
      errorType: 'unknown'
    };
  }
  if (zipUrl) {
    const zipFileName = zipUrl.split('/').pop() || '';
    // ========== 改这里：匹配新格式 ==========
    const fileNamePattern = /^sparklet-v\d+\.\d+\.\d+-win-x86_64\.zip$/;
    // ========== 改完 ==========
    if (!fileNamePattern.test(zipFileName)) {
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion,
        zipUrl: null,
        manifestUrl: null,
        error: `Invalid zip filename: ${zipFileName}`,
        errorType: 'unknown'
      };
    }
  } else {
    console.log('[UpdateCheck] No update package found, treating as no update');
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion,
      zipUrl: null,
      manifestUrl: null,
      error: null,
      errorType: null
    };
  }
  if (!manifestUrl) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion,
      zipUrl: null,
      manifestUrl: null,
      error: 'manifest.releases.json not found',
      errorType: 'unknown'
    };
  }
  const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
  console.log('[UpdateCheck] Latest version:', latestVersion, 'Has update:', hasUpdate);
  return {
    hasUpdate,
    currentVersion,
    latestVersion,
    zipUrl,
    manifestUrl,
    error: null,
    errorType: null
  };
}

module.exports = {
  getCurrentVersion,
  compareVersions,
  fetchLatestRelease,
  checkForUpdates
};