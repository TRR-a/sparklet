// src/shared/integrity/integrity-checker.js
// 文件完整性校验核心逻辑
const { scanProjectFiles } = require('./file-scanner.js');
const { computeFilesHash } = require('./file-hasher.js');
const { getCurrentVersionHashes } = require('./hash-manifest.js');

/**
 * 执行完整的文件完整性校验
 * @returns {Promise<Object>} 校验结果
 */
async function runIntegrityCheck() {
  console.log('开始执行文件完整性校验...');
  
  // 1. 获取云端基准哈希
  const cloudHashes = await getCurrentVersionHashes();
  if (!cloudHashes) {
    return {
      success: false,
      error: '无法获取云端基准哈希',
      corruptedFiles: []
    };
  }
  
  // 2. 扫描本地文件
  const localFiles = await scanProjectFiles();
  const localHashes = await computeFilesHash(localFiles);
  
  // 3. 比对哈希
  const corruptedFiles = [];
  const missingFiles = [];
  const extraFiles = [];
  
  // 检查云端存在但本地缺失或哈希不一致的文件
  for (const [filePath, expectedHash] of Object.entries(cloudHashes)) {
    if (!localHashes[filePath]) {
      missingFiles.push(filePath);
    } else if (localHashes[filePath] !== expectedHash) {
      corruptedFiles.push(filePath);
    }
  }
  
  // 检查本地存在但云端没有的文件（可选）
  for (const filePath of Object.keys(localHashes)) {
    if (!cloudHashes[filePath]) {
      extraFiles.push(filePath);
    }
  }
  
  const isIntegrityOk = corruptedFiles.length === 0 && missingFiles.length === 0;
  
  console.log('文件完整性校验完成:', {
    isIntegrityOk,
    corruptedFiles,
    missingFiles,
    extraFiles
  });
  
  return {
    success: true,
    isIntegrityOk,
    corruptedFiles,
    missingFiles,
    extraFiles
  };
}

module.exports = {
  runIntegrityCheck
};