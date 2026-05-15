// src/shared/integrity/integrity-controller.js
// 文件完整性校验控制器
const { runIntegrityCheck } = require('./integrity-checker.js');
const { 
  integrityConfig, 
  INTEGRITY_STRATEGY, 
  INTEGRITY_DELAYS 
} = require('../../../config/integrity/integrity.config.js');

let checkTimer = null;
let mainWindow = null;

/**
 * 初始化完整性校验控制器
 * @param {BrowserWindow} win 主窗口实例
 */
function initIntegrityController(win) {
  mainWindow = win;
  const config = integrityConfig.get();
  
  if (config.autoCheckEnabled) {
    startAutoCheck();
  }
  
  // 监听应用退出，清除定时器
  process.on('exit', () => stopAutoCheck());
}

/**
 * 启动自动校验定时器
 */
function startAutoCheck() {
  stopAutoCheck();
  const config = integrityConfig.get();
  
  // 立即执行一次校验（如果上次校验超过1小时）
  const now = Date.now();
  if (now - config.lastCheckTime > config.checkInterval) {
    checkAndNotify();
  }
  
  // 设置定时任务
  checkTimer = setInterval(checkAndNotify, config.checkInterval);
}

/**
 * 停止自动校验
 */
function stopAutoCheck() {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}

/**
 * 执行校验并根据策略通知用户
 */
async function checkAndNotify() {
  const config = integrityConfig.get();
  
  // 更新最后校验时间
  integrityConfig.set({ lastCheckTime: Date.now() });
  
  // 如果是永久忽略，直接返回
  if (config.currentStrategy === INTEGRITY_STRATEGY.NEVER) {
    return;
  }
  
  // 如果还没到下次提醒时间，直接返回
  if (config.nextRemindTime > Date.now()) {
    return;
  }
  
  const result = await runIntegrityCheck();
  
  if (!result.success || result.isIntegrityOk) {
    return;
  }
  
  // 文件被篡改，弹出提示
  showTamperAlert(result);
}

/**
 * 显示文件篡改提示弹窗
 * @param {Object} result 校验结果
 */
function showTamperAlert(result) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  
  // 发送IPC消息给渲染进程显示弹窗
  mainWindow.webContents.send('integrity:tamper-detected', {
    corruptedFiles: result.corruptedFiles,
    missingFiles: result.missingFiles
  });
}

/**
 * 处理用户选择的策略
 * @param {string} strategy 用户选择的策略
 */
function handleUserStrategy(strategy) {
  const config = integrityConfig.get();
  let nextRemindTime = 0;
  
  switch (strategy) {
    case INTEGRITY_STRATEGY.IMMEDIATE:
      // 立即更新修复，交给更新模块处理
      mainWindow.webContents.send('update:trigger-immediate');
      break;
    case INTEGRITY_STRATEGY.DELAY_30MIN:
    case INTEGRITY_STRATEGY.DELAY_1H:
    case INTEGRITY_STRATEGY.DELAY_2H:
    case INTEGRITY_STRATEGY.DELAY_1D:
      nextRemindTime = Date.now() + INTEGRITY_DELAYS[strategy];
      break;
    case INTEGRITY_STRATEGY.ON_RESTART:
      // 重启时提醒，下次启动时会自动校验
      nextRemindTime = Infinity;
      break;
    case INTEGRITY_STRATEGY.NEVER:
      // 永久不提醒
      nextRemindTime = Infinity;
      break;
  }
  
  // 保存用户选择的策略
  integrityConfig.set({
    currentStrategy: strategy,
    nextRemindTime
  });
}

module.exports = {
  initIntegrityController,
  runIntegrityCheck,
  handleUserStrategy
};