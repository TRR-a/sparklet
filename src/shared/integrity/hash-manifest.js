// src/shared/integrity/hash-manifest.js
// 云端哈希清单管理
const { CURRENT_VERSION, INTEGRITY_MANIFEST_URL } = require('../../../config/integrity/integrity.config.js');

/**
 * 从GitHub拉取云端哈希清单
 * @returns {Promise<Object|null>} 云端哈希清单对象
 */
async function fetchCloudManifest() {
  try {
    const response = await fetch(INTEGRITY_MANIFEST_URL);
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('拉取云端哈希清单失败:', err);
    return null;
  }
}

/**
 * 获取当前版本对应的云端哈希
 * @returns {Promise<Object|null>} {文件路径: 哈希值}
 */
async function getCurrentVersionHashes() {
  const manifest = await fetchCloudManifest();
  if (!manifest || !manifest[CURRENT_VERSION]) {
    console.error(`未找到版本 ${CURRENT_VERSION} 的哈希数据`);
    return null;
  }
  return manifest[CURRENT_VERSION];
}

/**
 * 生成本地哈希清单（用于生成基准文件）
 * @returns {Promise<Object>} {版本号: {文件路径: 哈希值}}
 */
async function generateLocalManifest() {
  const { scanProjectFiles } = require('./file-scanner.js');
  const { computeFilesHash } = require('./file-hasher.js');
  
  const files = await scanProjectFiles();
  const hashes = await computeFilesHash(files);
  
  return {
    [CURRENT_VERSION]: hashes
  };
}

module.exports = {
  fetchCloudManifest,
  getCurrentVersionHashes,
  generateLocalManifest
};