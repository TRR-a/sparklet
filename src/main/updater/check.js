// src/main/updater/check.js
// Version check: fetch GitHub release, compare versions

const https = require('https');
const { URL } = require('url');
const { GITHUB_API_URL, REQUEST_TIMEOUT_MS } = require('./constants');
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
          resolve({
            success: false,
            data: null,
            error: 'GitHub API rate limit exceeded, please try later'
          });
          return;
        }
      }
      if (res.statusCode !== 200) {
        resolve({
          success: false,
          data: null,
          error: `GitHub API error: ${res.statusCode}`
        });
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ success: true, data: parsed, error: null });
        } catch (err) {
          resolve({
            success: false,
            data: null,
            error: 'Failed to parse GitHub API response'
          });
        }
      });
    });
    req.on('error', (err) => {
      resolve({
        success: false,
        data: null,
        error: `Network error: ${err.message}`
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        data: null,
        error: 'Request timeout'
      });
    });
  });
}

async function checkForUpdates() {
  const currentVersion = getCurrentVersion();
  console.log('[UpdateCheck] Current version:', currentVersion);
  const { success, data, error } = await fetchLatestRelease();
  if (!success) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: null,
      zipUrl: null,
      manifestUrl: null,
      error
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
      error: `Invalid tag format: ${latestTag} does not start with 'v'`
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
      error: `Invalid tag format: ${latestTag} does not match vX.X.X`
    };
  }
  if (zipUrl) {
    const zipFileName = zipUrl.split('/').pop() || '';
    const fileNamePattern = /^Sparklet-v\d+\.\d+\.\d+\.zip$/;
    if (!fileNamePattern.test(zipFileName)) {
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion,
        zipUrl: null,
        manifestUrl: null,
        error: `Invalid zip filename: ${zipFileName}`
      };
    }
  } else {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion,
      zipUrl: null,
      manifestUrl: null,
      error: 'No update package found (Sparklet-vX.X.X.zip)'
    };
  }
  if (!manifestUrl) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion,
      zipUrl: null,
      manifestUrl: null,
      error: 'manifest.releases.json not found'
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
    error: null
  };
}

module.exports = {
  getCurrentVersion,
  compareVersions,
  fetchLatestRelease,
  checkForUpdates
};