// src/shared/update/update-controller.js
// 职责：更新全流程调度、对外统一入口、异常兜底
// 约束：主进程仅需引入这个文件即可使用全部更新能力

const { checkForUpdates } = require('./update-checker');
const { showUpdateDialog, showDownloadingDialog, showUpdateCompleteDialog } = require('./update-dialog');
const { isDevEnvironment } = require('../integrity/file-scanner');

/**
 * 执行完整的更新检查流程（检测+弹窗+用户交互）
 * 用于手动点击「检查更新」按钮触发
 * @returns {Promise<Object>} 检查结果
 */
async function runFullUpdateCheck() {
  try {
    console.log('Starting full update check...');
    
    // 1. 执行更新检测
    const updateResult = await checkForUpdates();

    // 2. 弹出更新提示弹窗（无更新/开发环境自动跳过）
    const userChooseUpdate = await showUpdateDialog(updateResult);

    // 3. 用户选择立即更新，后续对接下载逻辑
    if (userChooseUpdate) {
      console.log('User chose to update now');
      await showDownloadingDialog();
      // 后续这里对接下载安装逻辑
    }

    console.log('Update check completed:', updateResult.hasUpdate ? 'New version found' : 'No update available');
    return {
      ...updateResult,
      userChooseUpdate
    };

  } catch (err) {
    console.error('Update check failed with error:', err);
    return {
      hasUpdate: false,
      error: `Update check failed: ${err.message}`
    };
  }
}

/**
 * 静默后台更新检测（不阻塞、不弹窗、仅记录日志）
 * 用于应用启动后自动后台执行
 */
async function runSilentUpdateCheck() {
  try {
    // 开发环境：跳过静默检测
    if (isDevEnvironment()) {
      console.warn('Development environment: silent update check skipped');
      return;
    }

    const updateResult = await checkForUpdates();
    console.log('Silent update check completed:', updateResult.hasUpdate ? 'New version found' : 'No update available');
    
    // 有更新时，后续可以加托盘提示，现在先静默记录
    return updateResult;
  } catch (err) {
    // 静默检测失败不做任何处理，仅记录日志
    console.warn('Silent update check failed:', err.message);
    return null;
  }
}

module.exports = {
  runFullUpdateCheck,
  runSilentUpdateCheck
};