// src/shared/integrity/file-hasher.js
// 文件哈希计算工具
const fs = require('fs');
const crypto = require('crypto');

/**
 * 计算单个文件的SHA-256哈希
 * @param {string} filePath 文件绝对路径
 * @returns {Promise<string>} 十六进制哈希值
 */
async function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * 批量计算多个文件的哈希
 * @param {string[]} filePaths 文件路径数组
 * @returns {Promise<Object>} {文件相对路径: 哈希值}
 */
async function computeFilesHash(filePaths) {
  const result = {};
  for (const filePath of filePaths) {
    try {
      // 转换为相对路径（相对于项目根目录）
      const relativePath = filePath.replace(process.cwd() + '\\', '').replace(/\\/g, '/');
      result[relativePath] = await computeFileHash(filePath);
    } catch (err) {
      console.error(`计算文件哈希失败: ${filePath}`, err);
    }
  }
  return result;
}

module.exports = {
  computeFileHash,
  computeFilesHash
};