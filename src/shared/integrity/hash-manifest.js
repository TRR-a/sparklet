// src/shared/integrity/hash-manifest.js
// 职责：仅负责哈希清单的生成、解析、基础防篡改校验
// 约束：清单结构标准化，兼容后续 GitHub API 对接

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * 标准哈希清单结构定义
 * @typedef {Object} HashManifest
 * @property {string} version - 应用版本号（对应 package.json 中的 version）
 * @property {string} generatedAt - 清单生成时间（ISO 8601 格式）
 * @property {string} signature - 清单自身的签名（防篡改）
 * @property {Object.<string, string>} files - 文件哈希映射，键为相对路径，值为 SHA256
 */

/**
 * 生成清单签名（防篡改）
 * @param {Object} manifestData - 不含 signature 的清单数据
 * @param {string} secret - 签名密钥（发版时使用，客户端仅校验）
 * @returns {string} 清单签名
 */
function generateManifestSignature(manifestData, secret = 'sparklet-integrity-default-secret') {
  // 移除 signature 字段（如果存在），确保签名一致性
  const dataToSign = { ...manifestData };
  delete dataToSign.signature;
  
  // 对数据进行排序，确保 JSON 序列化顺序一致
  const sortedData = JSON.stringify(dataToSign, Object.keys(dataToSign).sort());
  
  // 使用 HMAC-SHA256 生成签名
  return crypto.createHmac('sha256', secret).update(sortedData).digest('hex');
}

/**
 * 验证清单签名
 * @param {HashManifest} manifest - 待验证的清单
 * @param {string} secret - 签名密钥
 * @returns {boolean} 签名是否有效
 */
function verifyManifestSignature(manifest, secret = 'sparklet-integrity-default-secret') {
  if (!manifest || !manifest.signature) {
    return false;
  }
  
  try {
    const expectedSignature = generateManifestSignature(manifest, secret);
    return crypto.timingSafeEqual(
      Buffer.from(manifest.signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (err) {
    console.warn('Manifest signature verification failed:', err.message);
    return false;
  }
}

/**
 * 生成标准哈希清单
 * @param {Map<string, string>} fileHashMap - 文件哈希映射（相对路径 -> SHA256）
 * @param {string} appVersion - 应用版本号
 * @returns {HashManifest} 标准哈希清单
 */
function generateManifest(fileHashMap, appVersion) {
  // 将 Map 转换为普通对象
  const files = {};
  fileHashMap.forEach((hash, relativePath) => {
    files[relativePath] = hash;
  });

  // 创建清单数据（不含签名）
  const manifestData = {
    version: appVersion,
    generatedAt: new Date().toISOString(),
    files: files
  };

  // 生成并添加签名
  const manifest = {
    ...manifestData,
    signature: generateManifestSignature(manifestData)
  };

  return manifest;
}

/**
 * 解析哈希清单 JSON 字符串
 * @param {string} manifestJson - 清单 JSON 字符串
 * @returns {HashManifest|null} 解析后的清单对象，解析失败返回 null
 */
function parseManifest(manifestJson) {
  try {
    const manifest = JSON.parse(manifestJson);
    
    // 验证清单结构完整性
    if (!manifest.version || !manifest.generatedAt || !manifest.files || !manifest.signature) {
      console.warn('Invalid manifest structure: missing required fields');
      return null;
    }

    // 验证签名
    if (!verifyManifestSignature(manifest)) {
      console.warn('Invalid manifest signature: manifest may be tampered');
      return null;
    }

    return manifest;
  } catch (err) {
    console.warn('Failed to parse manifest:', err.message);
    return null;
  }
}

/**
 * 从本地文件加载哈希清单
 * @param {string} filePath - 清单文件路径
 * @returns {Promise<HashManifest|null>} 加载的清单对象，失败返回 null
 */
async function loadManifestFromFile(filePath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      resolve(null);
      return;
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.warn('Failed to read manifest file:', err.message);
        resolve(null);
        return;
      }
      resolve(parseManifest(data));
    });
  });
}

/**
 * 将哈希清单保存到本地文件
 * @param {HashManifest} manifest - 待保存的清单
 * @param {string} filePath - 保存路径
 * @returns {Promise<boolean>} 是否保存成功
 */
async function saveManifestToFile(manifest, filePath) {
  return new Promise((resolve) => {
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 格式化输出 JSON，便于阅读
    const manifestJson = JSON.stringify(manifest, null, 2);
    
    fs.writeFile(filePath, manifestJson, 'utf8', (err) => {
      if (err) {
        console.warn('Failed to save manifest file:', err.message);
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

module.exports = {
  generateManifest,
  parseManifest,
  loadManifestFromFile,
  saveManifestToFile,
  verifyManifestSignature
};