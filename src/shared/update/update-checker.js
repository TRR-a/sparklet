// src/shared/update/update-checker.js
// 版本检测工具
const { 
  CURRENT_VERSION, 
  GITHUB_RELEASES_URL 
} = require('../../../config/update/update.config.js');

/**
 * 从GitHub获取最新版本信息
 * @returns {Promise<Object|null>} 最新版本信息
 */
async function fetchLatestRelease() {
  try {
    const response = await fetch(GITHUB_RELEASES_URL);
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('获取最新版本信息失败:', err);
    return null;
  }
}

/**
 * 检查是否有新版本
 * @returns {Promise<Object>} 检查结果
 */
async function checkForUpdates() {
  console.log('开始检查版本更新...');
  
  const latestRelease = await fetchLatestRelease();
  if (!latestRelease) {
    return {
      hasUpdate: false,
      error: '无法获取最新版本信息'
    };
  }

  const latestVersion = latestRelease.tag_name;
  const currentVersionNum = parseInt(CURRENT_VERSION.replace('v', '').replace(/\./g, ''));
  const latestVersionNum = parseInt(latestVersion.replace('v', '').replace(/\./g, ''));

  const hasUpdate = latestVersionNum > currentVersionNum;
  
  console.log('版本检查完成:', {
    currentVersion: CURRENT_VERSION,
    latestVersion,
    hasUpdate
  });

  return {
    hasUpdate,
    latestVersion,
    releaseNotes: latestRelease.body,
    downloadUrl: latestRelease.assets[0]?.browser_download_url
  };
}

module.exports = {
  checkForUpdates,
  fetchLatestRelease
};