// src/shared/integrity/file-scanner.js
// 项目文件扫描工具
const fs = require('fs');
const path = require('path');

// 需要扫描的目录（只校验源代码和资源文件）
const SCAN_DIRS = ['src/', 'assets/', 'config/'];
// 需要排除的文件/目录
const EXCLUDE_PATTERNS = [
  'node_modules/', '.git/', 'release/', 'dist/', 'out/', 'build/',
  '.DS_Store', 'Thumbs.db', '.env', '.gitignore', 'package-lock.json'
];

/**
 * 递归扫描目录下的所有文件
 * @param {string} dir 目录路径
 * @returns {Promise<string[]>} 文件绝对路径数组
 */
async function scanDirectory(dir) {
  const files = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = fullPath.replace(process.cwd() + '\\', '').replace(/\\/g, '/');
    
    // 跳过排除项
    if (EXCLUDE_PATTERNS.some(pattern => relativePath.includes(pattern))) {
      continue;
    }
    
    if (entry.isDirectory()) {
      files.push(...await scanDirectory(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * 扫描项目中所有需要校验的文件
 * @returns {Promise<string[]>} 文件绝对路径数组
 */
async function scanProjectFiles() {
  const allFiles = [];
  for (const dir of SCAN_DIRS) {
    const fullDir = path.join(process.cwd(), dir);
    if (fs.existsSync(fullDir)) {
      allFiles.push(...await scanDirectory(fullDir));
    }
  }
  return allFiles;
}

module.exports = {
  scanProjectFiles
};