// src/shared/update/update-dialog.js
// 更新弹窗控制器
let mainWindow = null;

/**
 * 初始化弹窗控制器
 * @param {BrowserWindow} win 主窗口实例
 */
function initUpdateDialog(win) {
  mainWindow = win;
}

/**
 * 显示更新可用弹窗
 * @param {Object} updateInfo 版本信息
 */
function showUpdateAvailable(updateInfo) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send('update:available', {
    currentVersion: require('../../../config/update/update.config.js').CURRENT_VERSION,
    latestVersion: updateInfo.latestVersion,
    releaseNotes: updateInfo.releaseNotes
  });
}

/**
 * 显示下载进度弹窗
 * @param {number} progress 下载进度(0-100)
 */
function showDownloadProgress(progress) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send('update:download-progress', { progress });
}

/**
 * 显示下载完成弹窗
 */
function showDownloadComplete() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send('update:download-complete');
}

/**
 * 显示更新错误弹窗
 * @param {string} error 错误信息
 */
function showUpdateError(error) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send('update:error', { error });
}

module.exports = {
  initUpdateDialog,
  showUpdateAvailable,
  showDownloadProgress,
  showDownloadComplete,
  showUpdateError
};