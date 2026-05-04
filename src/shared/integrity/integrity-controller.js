// src/shared/integrity/integrity-controller.js
// 职责：全流程调度、对外统一入口、异常兜底
// 约束：主进程仅需引入这个文件即可使用全部能力

const { computeBatchHashes } = require('./file-hasher');
const { getFilesToVerify, getBaseDirectory, isDevEnvironment } = require('./file-scanner');
const { parseManifest, loadManifestFromFile } = require('./hash-manifest');
const { compareHashes, createEmptyResult, CheckStatus } = require('./integrity-checker');
const Store = require('electron-store');

// 初始化存储实例（复用项目现有配置）
const store = new Store({
  name: 'sparklet-data'
});

// 存储键名定义
const STORAGE_KEYS = {
  LAST_RESULT: 'integrityLastResult',
  LAST_CHECK_TIME: 'integrityLastCheckTime'
};

/**
 * 获取应用版本号（从 package.json 读取，跨环境兼容）
 * @returns {string} 应用版本号
 */
function getAppVersion() {
  try {
    const path = require('path');
    let packageJsonPath;

    // 开发环境：直接读取项目根目录的package.json
    if (isDevEnvironment()) {
      packageJsonPath = path.join(getBaseDirectory(), 'package.json');
    } else {
      // 打包后环境：读取asar包内的package.json
      packageJsonPath = path.join(process.resourcesPath, 'app', 'package.json');
    }
    
    const packageJson = require(packageJsonPath);
    return packageJson.version || 'unknown';
  } catch (err) {
    console.warn('Failed to get app version:', err.message);
    return 'unknown';
  }
}

/**
 * 保存校验结果到本地存储
 * @param {Object} result - 校验结果
 */
async function saveCheckResult(result) {
  try {
    await store.set(STORAGE_KEYS.LAST_RESULT, result);
    await store.set(STORAGE_KEYS.LAST_CHECK_TIME, new Date().toISOString());
  } catch (err) {
    console.warn('Failed to save check result:', err.message);
  }
}

/**
 * 获取上次校验结果
 * @returns {Promise<Object|null>} 上次校验结果
 */
async function getLastCheckResult() {
  try {
    return await store.get(STORAGE_KEYS.LAST_RESULT);
  } catch (err) {
    console.warn('Failed to get last check result:', err.message);
    return null;
  }
}

/**
 * 执行完整的文件完整性校验
 * @param {Object} [options] - 校验选项
 * @param {string} [options.manifestJson] - 可选：直接传入清单 JSON 字符串（用于 GitHub API 对接）
 * @param {string} [options.manifestPath] - 可选：本地清单文件路径
 * @returns {Promise<Object>} 标准化校验结果
 */
async function runFullCheck(options = {}) {
  const appVersion = getAppVersion();
  
  try {
    console.log('Starting integrity check...');
    
    // 1. 获取待校验文件列表
    console.log('Scanning files...');
    const { files, baseDir } = await getFilesToVerify();
    if (files.length === 0) {
      const result = {
        ...createEmptyResult(appVersion),
        status: CheckStatus.WARNING,
        summary: 'No files to verify'
      };
      await saveCheckResult(result);
      return result;
    }

    // 2. 批量计算本地文件哈希
    console.log('Computing file hashes...');
    const localHashMap = await computeBatchHashes(files, baseDir);

    // 3. 获取哈希清单
    console.log('Loading hash manifest...');
    let manifest = null;
    
    if (options.manifestJson) {
      // 优先使用直接传入的清单 JSON
      manifest = parseManifest(options.manifestJson);
    } else if (options.manifestPath) {
      // 其次使用本地清单文件
      manifest = await loadManifestFromFile(options.manifestPath);
    } else {
      // 开发环境：临时生成本地清单用于测试
      // 生产环境：这里应该对接 GitHub API 拉取远端清单
      if (isDevEnvironment()) {
        console.warn('Development environment: using temporary local manifest');
        // 这里可以临时生成一个清单用于测试，实际生产环境应从远端拉取
        manifest = {
          version: appVersion,
          generatedAt: new Date().toISOString(),
          files: Object.fromEntries(localHashMap),
          signature: 'dev-environment-placeholder'
        };
      } else {
        // 生产环境：无清单时返回错误
        const result = {
          ...createEmptyResult(appVersion),
          status: CheckStatus.ERROR,
          summary: 'Integrity check failed: no manifest available'
        };
        await saveCheckResult(result);
        return result;
      }
    }

    // 4. 比对哈希
    console.log('Comparing hashes...');
    const result = compareHashes(localHashMap, manifest);

    // 5. 保存结果
    await saveCheckResult(result);

    console.log('Integrity check completed:', result.summary);
    return result;
  } catch (err) {
    console.error('Integrity check failed with error:', err);
    const result = {
      ...createEmptyResult(appVersion),
      status: CheckStatus.ERROR,
      issues: [{
        message: `Check failed with error: ${err.message}`
      }],
      summary: `Integrity check failed: ${err.message}`
    };
    await saveCheckResult(result);
    return result;
  }
}

/**
 * 静默后台校验（不阻塞、不弹窗、仅记录结果）
 * 用于应用启动后自动执行
 */
async function runSilentCheck() {
  try {
    await runFullCheck();
  } catch (err) {
    // 静默校验失败不做任何处理，仅记录日志
    console.warn('Silent integrity check failed:', err.message);
  }
}

/**
 * 修复损坏文件（占位实现，后续可对接更新逻辑）
 * @returns {Promise<boolean>} 是否修复成功
 */
async function fixCorruptedFiles() {
  console.warn('File repair not implemented yet');
  // 后续实现：
  // 1. 获取上次校验结果中的损坏文件列表
  // 2. 对接 GitHub Releases 下载对应文件
  // 3. 替换本地损坏文件
  // 4. 重新执行校验
  return false;
}

module.exports = {
  runFullCheck,
  runSilentCheck,
  getLastCheckResult,
  fixCorruptedFiles
};