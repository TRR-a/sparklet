// src/shared/update/update-dialog.js
// 职责：更新检测结果弹窗、用户交互选择
// 约束：仅做UI交互，不包含下载/安装逻辑

const { dialog } = require('electron');
const { isDevEnvironment } = require('../integrity/file-scanner');

/**
 * 弹出更新提示窗口
 * @param {Object} updateInfo 检测结果（来自update-checker）
 * @returns {Promise<boolean>} 用户是否选择立即更新
 */
async function showUpdateDialog(updateInfo) {
  // 开发环境：不弹窗，直接返回false
  if (isDevEnvironment()) {
    console.warn('Development environment: update dialog skipped');
    return false;
  }

  // 无更新：不弹窗
  if (!updateInfo.hasUpdate) {
    console.log('No update available, dialog skipped');
    return false;
  }

  const { releaseInfo } = updateInfo;
  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: '发现新版本',
    message: `Sparklet v${releaseInfo.version} 已发布！`,
    detail: `当前版本：v${updateInfo.localVersion}\n最新版本：v${releaseInfo.version}\n\n更新内容：\n${releaseInfo.body || '暂无更新说明'}\n\n发布时间：${new Date(releaseInfo.publishedAt).toLocaleString('zh-CN')}`,
    buttons: ['稍后再说', '立即更新'],
    defaultId: 1,
    cancelId: 0
  });

  // 返回用户选择：true=立即更新，false=稍后再说
  return response === 1;
}

/**
 * 弹出更新下载中提示（占位，后续对接下载进度）
 */
async function showDownloadingDialog() {
  dialog.showMessageBox({
    type: 'info',
    title: '正在下载',
    message: '新版本正在下载中，请稍候...',
    buttons: ['确定']
  });
}

/**
 * 弹出更新完成提示
 */
async function showUpdateCompleteDialog() {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: '更新完成',
    message: '新版本已安装完成，请重启软件生效！',
    buttons: ['稍后重启', '立即重启'],
    defaultId: 1,
    cancelId: 0
  });

  if (response === 1) {
    // 重启应用（占位，后续实现）
    console.log('User chose to restart now');
  }
}

module.exports = {
  showUpdateDialog,
  showDownloadingDialog,
  showUpdateCompleteDialog
};