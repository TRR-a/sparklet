// src/shared/update/update-checker.js
// 职责：GitHub Releases 版本检测、语义化版本比对
// 约束：仅做版本检测，不包含下载/安装逻辑

const { getBaseDirectory, isDevEnvironment } = require('../integrity/file-scanner');

// 配置项（直接用你的仓库地址，不用改）
const GITHUB_CONFIG = {
  owner: 'TRR-a',
  repo: 'sparklet',
  apiUrl: 'https://api.github.com/repos/TRR-a/sparklet/releases/latest'
};

/**
 * 获取本地应用版本号
 * @returns {string} 本地版本号
 */
function getLocalVersion() {
  try {
    const path = require('path');
    const packageJsonPath = path.join(getBaseDirectory(), 'package.json');
    const packageJson = require(packageJsonPath);
    return packageJson.version || '0.0.0';
  } catch (err) {
    console.warn('Failed to get local version:', err.message);
    return '0.0.0';
  }
}

/**
 * 语义化版本比对
 * @param {string} v1 版本1
 * @param {string} v2 版本2
 * @returns {number} 1: v1>v2 | 0: 相等 | -1: v1<v2
 */
function compareVersions(v1, v2) {
  const v1Parts = v1.replace(/^v/, '').split('.').map(Number);
  const v2Parts = v2.replace(/^v/, '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const num1 = v1Parts[i] || 0;
    const num2 = v2Parts[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * 从GitHub拉取最新Release版本信息
 * @returns {Promise<Object|null>} 最新版本信息
 */
async function fetchLatestRelease() {
  try {
    const fetch = require('node-fetch');
    const response = await fetch(GITHUB_CONFIG.apiUrl, {
      headers: { 'User-Agent': 'Sparklet-App' },
      timeout: 10000
    });

    if (!response.ok) return null;
    const release = await response.json();
    return {
      version: release.tag_name.replace(/^v/, ''),
      name: release.name,
      body: release.body,
      downloadUrl: release.assets?.[0]?.browser_download_url || null,
      publishedAt: release.published_at,
      prerelease: release.prerelease
    };
  } catch (err) {
    console.warn('Failed to fetch latest release:', err.message);
    return null;
  }
}

/**
 * 执行更新检测
 * @returns {Promise<Object>} 检测结果
 */
async function checkForUpdates() {
  const localVersion = getLocalVersion();
  console.log(`Current local version: v${localVersion}`);

  // 开发环境：跳过检测，打日志即可
  if (isDevEnvironment()) {
    console.warn('Development environment: update check skipped');
    return {
      hasUpdate: false,
      localVersion,
      latestVersion: localVersion,
      isDev: true,
      releaseInfo: null
    };
  }

  // 拉取最新版本
  const latestRelease = await fetchLatestRelease();
  if (!latestRelease) {
    return {
      hasUpdate: false,
      localVersion,
      latestVersion: null,
      error: 'Failed to fetch latest version'
    };
  }

  // 版本比对
  const compareResult = compareVersions(latestRelease.version, localVersion);
  const hasUpdate = compareResult === 1;

  console.log(`Latest remote version: v${latestRelease.version}`);
  console.log(hasUpdate ? 'New update available!' : 'No update available');

  return {
    hasUpdate,
    localVersion,
    latestVersion: latestRelease.version,
    releaseInfo: latestRelease
  };
}

module.exports = {
  checkForUpdates,
  getLocalVersion,
  compareVersions
};