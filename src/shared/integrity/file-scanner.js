// src/shared/integrity/file-scanner.js
// 职责：仅负责待校验文件的扫描、白名单/黑名单过滤
// 约束：绝对不碰用户数据、配置文件、缓存、日志目录

const fs = require('fs');
const path = require('path');

/**
 * 白名单配置：仅允许扫描的目录和文件类型
 * 只覆盖程序核心文件，不包含任何用户数据
 */
const SCAN_WHITELIST = {
  // 允许扫描的目录（相对项目根目录）
  directories: ['src', 'assets'],
  // 允许扫描的文件扩展名
  extensions: ['.js', '.json', '.html', '.css', '.png', '.ico', '.svg']
};

/**
 * 黑名单配置：绝对禁止扫描的目录和文件
 * 优先级高于白名单，确保用户数据绝对安全
 */
const SCAN_BLACKLIST = {
  // 禁止扫描的目录（包含用户数据、缓存、日志）
  directories: ['node_modules', '.git', 'release', 'dist', 'out', 'build'],
  // 禁止扫描的文件（配置、日志、临时文件）
  files: ['.gitignore', '.env', '.env.local', 'npm-debug.log', 'yarn-debug.log', 'yarn-error.log']
};

/**
 * 判断是否为开发环境（Electron标准跨平台兼容方案）
 * @returns {boolean} 是否在开发环境中运行
 */
function isDevEnvironment() {
  // 标准Electron开发环境判断：
  // 1. process.defaultApp 为true时，是通过 electron . 启动的开发环境
  // 2. 检查启动参数是否包含 --dev，兼容你package.json里的dev脚本
  return process.defaultApp || process.argv.includes('--dev');
}

/**
 * 获取项目根目录（适配开发环境和打包后环境）
 * @returns {string} 项目根目录的绝对路径
 */
function getBaseDirectory() {
  if (isDevEnvironment()) {
    // 开发环境：返回项目根目录
    return path.join(__dirname, '../../..');
  } else {
    // 打包后环境：返回应用安装目录
    return path.dirname(process.execPath);
  }
}

/**
 * 检查文件是否在白名单内
 * @param {string} filePath - 文件的绝对路径
 * @param {string} baseDir - 项目根目录
 * @returns {boolean} 是否在白名单内
 */
function isFileInWhitelist(filePath, baseDir) {
  const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
  const ext = path.extname(filePath).toLowerCase();
  
  // 检查文件扩展名
  if (!SCAN_WHITELIST.extensions.includes(ext)) {
    return false;
  }
  
  // 检查是否在允许的目录下
  return SCAN_WHITELIST.directories.some(dir => 
    relativePath.startsWith(dir + '/') || relativePath === dir
  );
}

/**
 * 检查文件是否在黑名单内
 * @param {string} filePath - 文件的绝对路径
 * @param {string} baseDir - 项目根目录
 * @returns {boolean} 是否在黑名单内
 */
function isFileInBlacklist(filePath, baseDir) {
  const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
  const fileName = path.basename(filePath);
  
  // 检查文件名是否在黑名单内
  if (SCAN_BLACKLIST.files.includes(fileName)) {
    return true;
  }
  
  // 检查目录是否在黑名单内
  return SCAN_BLACKLIST.directories.some(dir => 
    relativePath.startsWith(dir + '/') || relativePath === dir
  );
}

/**
 * 递归扫描目录，返回符合白名单的文件列表
 * @param {string} dir - 要扫描的目录绝对路径
 * @param {string} baseDir - 项目根目录
 * @param {string[]} [fileList=[]] - 用于递归的文件列表
 * @returns {string[]} 符合条件的文件绝对路径数组
 */
function scanDirectory(dir, baseDir, fileList = []) {
  // 检查目录本身是否在黑名单内
  if (isFileInBlacklist(dir, baseDir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 递归扫描子目录
      scanDirectory(filePath, baseDir, fileList);
    } else if (stat.isFile()) {
      // 检查文件是否符合白名单且不在黑名单内
      if (isFileInWhitelist(filePath, baseDir) && !isFileInBlacklist(filePath, baseDir)) {
        fileList.push(filePath);
      }
    }
  }

  return fileList;
}

/**
 * 获取所有待校验的文件列表
 * @returns {Promise<{files: string[], baseDir: string}>} 待校验文件列表和项目根目录
 */
async function getFilesToVerify() {
  const baseDir = getBaseDirectory();
  let filesToScan = [];

  if (isDevEnvironment()) {
    // 开发环境：扫描白名单目录
    for (const dir of SCAN_WHITELIST.directories) {
      const dirPath = path.join(baseDir, dir);
      if (fs.existsSync(dirPath)) {
        filesToScan = filesToScan.concat(scanDirectory(dirPath, baseDir));
      }
    }
  } else {
    // 打包后环境：简化扫描逻辑，仅扫描核心程序文件
    // 这里可以根据实际打包结构进行调整
    const resourcesDir = path.join(baseDir, 'resources');
    if (fs.existsSync(resourcesDir)) {
      filesToScan = scanDirectory(resourcesDir, baseDir);
    }
  }

  return {
    files: filesToScan,
    baseDir: baseDir
  };
}

module.exports = {
  getFilesToVerify,
  getBaseDirectory,
  isDevEnvironment
};