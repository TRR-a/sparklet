// src/shared/update/update-controller.js
// 更新模块主控制器
const { checkForUpdates } = require('./update-checker.js');
const { downloadUpdate } = require('./update-downloader.js');
const { 
  initUpdateDialog,
  showUpdateAvailable,
  showDownloadProgress,
  showDownloadComplete,
  showUpdateError
} = require('./update-dialog.js');
const { 
  updateConfig, 
  UPDATE_STRATEGY, 
  UPDATE_DELAYS 
} = require('../../../config/update/update.config.js');
const { exec } = require('child_process');
const path = require('path');
const { app } = require('electron');

let checkTimer = null;
let mainWindow = null;
let downloadedUpdatePath = null;

/**
 * 初始化更新控制器
 * @param {BrowserWindow} win 主窗口实例
 */
function initUpdateController(win) {
  mainWindow = win;
  initUpdateDialog(win);
  
  const config = updateConfig.get();
  
  if (config.autoCheckEnabled) {
    startAutoCheck();
  }
  
  // 监听应用退出，清除定时器
  process.on('exit', () => stopAutoCheck());
}

/**
 * 启动自动更新检测定时器
 */
function startAutoCheck() {
  stopAutoCheck();
  const config = updateConfig.get();
  
  // 立即执行一次检查（如果上次检查超过1小时）
  const now = Date.now();
  if (now - config.lastCheckTime > config.checkInterval) {
    checkAndNotify();
  }
  
  // 设置定时任务
  checkTimer = setInterval(checkAndNotify, config.checkInterval);
}

/**
 * 停止自动更新检测
 */
function stopAutoCheck() {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}

/**
 * 执行更新检查并根据策略通知用户
 */
async function checkAndNotify() {
  const config = updateConfig.get();
  
  // 更新最后检查时间
  updateConfig.set({ lastCheckTime: Date.now() });
  
  // 如果是永久忽略，直接返回
  if (config.currentStrategy === UPDATE_STRATEGY.NEVER) {
    return;
  }
  
  // 如果还没到下次提醒时间，直接返回
  if (config.nextRemindTime > Date.now()) {
    return;
  }
  
  const result = await checkForUpdates();
  
  if (!result.hasUpdate) {
    return;
  }
  
  // 有新版本，弹出提示
  showUpdateAvailable(result);
}

/**
 * 处理用户选择的策略
 * @param {string} strategy 用户选择的策略
 * @param {Object} updateInfo 版本信息
 */
async function handleUserStrategy(strategy, updateInfo) {
  const config = updateConfig.get();
  let nextRemindTime = 0;
  
  switch (strategy) {
    case UPDATE_STRATEGY.IMMEDIATE:
      // 立即下载并更新
      await downloadAndInstall(updateInfo.downloadUrl);
      break;
    case UPDATE_STRATEGY.DELAY_30MIN:
    case UPDATE_STRATEGY.DELAY_1H:
    case UPDATE_STRATEGY.DELAY_2H:
    case UPDATE_STRATEGY.DELAY_1D:
      nextRemindTime = Date.now() + UPDATE_DELAYS[strategy];
      break;
    case UPDATE_STRATEGY.ON_RESTART:
      // 重启时提醒，下次启动时会自动检查
      nextRemindTime = Infinity;
      break;
    case UPDATE_STRATEGY.NEVER:
      // 永久不提醒
      nextRemindTime = Infinity;
      updateConfig.set({ ignoredVersion: updateInfo.latestVersion });
      break;
  }
  
  // 保存用户选择的策略
  updateConfig.set({
    currentStrategy: strategy,
    nextRemindTime
  });
}

/**
 * 下载并安装更新
 * @param {string} downloadUrl 下载地址
 */
async function downloadAndInstall(downloadUrl) {
  try {
    // 下载更新包
    downloadedUpdatePath = await downloadUpdate(downloadUrl, (progress) => {
      showDownloadProgress(progress);
    });
    
    showDownloadComplete();
    
    // 启动updater.exe进行替换
    launchUpdater();
  } catch (err) {
    console.error('更新失败:', err);
    showUpdateError(err.message);
  }
}

/**
 * 启动外部更新器并退出主程序（v0.2.2 源码版用node运行updater.js）
 */
function launchUpdater() {
  if (!downloadedUpdatePath) {
    return;
  }

  const updaterPath = path.join(process.cwd(), 'updater.js');
  const appPath = process.cwd();
  
  console.log('启动更新器:', updaterPath);
  console.log('更新包路径:', downloadedUpdatePath);
  console.log('应用路径:', appPath);
  
  // 用node运行updater.js，传递参数：更新包路径、应用路径、主程序PID
  const cmd = `node "${updaterPath}" "${downloadedUpdatePath}" "${appPath}" ${process.pid}`;
  
  exec(cmd, (err) => {
    if (err) {
      console.error('启动更新器失败:', err);
      showUpdateError('启动更新器失败，请手动下载更新');
      return;
    }
    
    // 退出主程序
    app.quit();
  });
}

module.exports = {
  initUpdateController,
  checkForUpdates,
  handleUserStrategy,
  downloadAndInstall
};