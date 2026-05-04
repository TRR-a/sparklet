// src/shared/integrity/file-hasher.js
// 职责：仅负责文件流式 SHA256 哈希计算
// 约束：只用 Node.js 原生 crypto 和 fs 模块，无第三方依赖

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * 流式计算单个文件的 SHA256 哈希值
 * @param {string} filePath - 待计算文件的绝对路径
 * @returns {Promise<string>} 文件的 SHA256 哈希值（十六进制）
 * @throws {Error} 文件读取失败或权限不足时抛出异常
 */
async function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    // 校验文件是否存在
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }

    // 创建 SHA256 哈希实例
    const hash = crypto.createHash('sha256');
    // 创建文件读取流（避免大文件一次性加载进内存）
    const fileStream = fs.createReadStream(filePath);

    // 流式处理数据
    fileStream.on('data', (chunk) => {
      hash.update(chunk);
    });

    // 读取完成，返回最终哈希值
    fileStream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    // 读取出错，抛出异常
    fileStream.on('error', (err) => {
      reject(new Error(`Failed to read file ${filePath}: ${err.message}`));
    });
  });
}

/**
 * 批量计算多个文件的 SHA256 哈希值
 * @param {string[]} filePaths - 待计算文件的绝对路径数组
 * @returns {Promise<Map<string, string>>} 键为文件相对路径，值为哈希值的 Map
 */
async function computeBatchHashes(filePaths, baseDir) {
  const hashMap = new Map();
  
  for (const filePath of filePaths) {
    try {
      const hash = await computeFileHash(filePath);
      // 转换为相对路径，便于跨平台比对
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
      hashMap.set(relativePath, hash);
    } catch (err) {
      console.warn(`Skipping file ${filePath}: ${err.message}`);
      // 单个文件失败不影响整体流程，仅记录警告
    }
  }

  return hashMap;
}

module.exports = {
  computeFileHash,
  computeBatchHashes
};