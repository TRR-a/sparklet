// src/shared/integrity/integrity-controller.js
// 职责：全流程调度、对外统一入口、异常兜底
// 约束：主进程仅需引入这个文件即可使用全部能力

const { dialog } = require('electron');
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
    console.warn('Failed to save result:', err.message);
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
    console.warn('Failed to get last result:', err.message);
    return null;
  }
}

/**
 * 执行完整的文件完整性校验
 * @param {Object} [options] - 校验选项
 * @param {string} [options.manifestJson] - 可选：直接传入清单 JSON 字符串
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
      manifest = parseManifest(options.manifestJson);
    } else if (options.manifestPath) {
      manifest = await loadManifestFromFile(options.manifestPath);
    } else {
      // 开发环境：临时生成本地清单
      if (isDevEnvironment()) {
        console.warn('Development environment: using temporary local manifest');
        manifest = {
          version: appVersion,
          generatedAt: new Date().toISOString(),
          files: Object.fromEntries(localHashMap),
          signature: 'dev-environment-placeholder'
        };
      } else {
        // 生产环境无清单 → 报错
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

    // ====================== 正常弹窗逻辑（无测试bug） ======================
    // 仅生产环境 + 校验失败 → 弹出警告
    if (!isDevEnvironment() && result.status !== CheckStatus.PASSED) {
      const { response } = await dialog.showMessageBox({
        type: 'warning',
        title: '文件完整性异常',
        message: '检测到程序核心文件异常，可能已损坏或被篡改！',
        detail: `校验结果：${result.summary}\n异常文件数量：${result.issues.length}`,
        buttons: ['稍后再说', '立即修复'],
        defaultId: 1,
        cancelId: 0
      });

      if (response === 1) {
        await fixCorruptedFiles();
        dialog.showMessageBox({
          type: 'info',
          title: '修复完成',
          message: '修复操作已执行，请重启软件生效！'
        });
      }
    }
    // ======================================================================

    console.log('Integrity check completed:', result.summary);
    return result;
  } catch (err) {
    console.error('Integrity check failed:', err);
    const result = {
      ...createEmptyResult(appVersion),
      status: CheckStatus.ERROR,
      issues: [{ message: `Check failed: ${err.message}` }],
      summary: `Integrity check failed: ${err.message}`
    };
    await saveCheckResult(result);
    return result;
  }
}

/**
 * 静默后台校验（不阻塞、不弹窗）
 */
async function runSilentCheck() {
  try {
    await runFullCheck();
  } catch (err) {
    console.warn('Silent check failed:', err.message);
  }
}

/**
 * 修复损坏文件（占位，明天实现完整逻辑）
 * @returns {Promise<boolean>}
 */
async function fixCorruptedFiles() {
  console.warn('File repair not implemented yet');
  return false;
}

module.exports = {
  runFullCheck,
  runSilentCheck,
  getLastCheckResult,
  fixCorruptedFiles
};