// src/main/updater/index.js
// Update module entry point

const { app, dialog, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const {
  DISABLE_UPDATE_FLAGS,
  MAX_RETRY_COUNT,
  getTempPath
} = require('./constants');
const { acquireTempDir, releaseTempDir } = require('./temp-manager');
const { checkForUpdates, getCurrentVersion } = require('./check');
const { downloadWithRetry } = require('./download');
const { verifyReleaseManifest, verifyPackageIntegrity, selfCheckIntegrity } = require('./verify');
const { installUpdate } = require('./installer');

// 更新状态
let isUpdating = false;
let pendingUpdate = null;
let updateDisabled = false;

function checkDisableFlags() {
  const args = process.argv;
  updateDisabled = DISABLE_UPDATE_FLAGS.some(flag => args.includes(flag));
  if (updateDisabled) {
    console.log('[Updater] Update disabled via command line flag');
  }
  return updateDisabled;
}

/**
 * 格式化日期显示（仅日期，不显示时间）
 */
function formatDate(isoString) {
  if (!isoString) return '未知';
  try {
    const date = new Date(isoString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return isoString;
  }
}

/**
 * 显示“发现新版本”对话框（用户选择是否更新）
 */
function showUpdateDialog(currentVersion, entry, onYes, onNo) {
  const version = entry.version || `v${currentVersion}`;
  const codename = entry.internalCodename || 'N/A';
  const releaseDate = formatDate(entry.releaseDate);
  const hashPrefix = entry.hash ? entry.hash.slice(0, 6) : '未知';

  const message = 
    `发现新版本：${version}\n` +
    `内部代号：${codename}\n` +
    `发布日期：${releaseDate}\n` +
    `SHA256（前6位）：${hashPrefix}\n` +
    `当前版本：v${currentVersion}\n\n` +
    `是否立即更新？`;

  dialog.showMessageBox({
    type: 'info',
    title: '发现新版本',
    message: message,
    buttons: ['是', '否'],
    defaultId: 0,
    cancelId: 1
  }).then(result => {
    if (result.response === 0) onYes();
    else onNo();
  });
}

/**
 * 显示“仅提醒”模式的通知
 */
function showNotifyOnlyDialog(currentVersion, entry, releaseUrl) {
  const version = entry.version || `v${currentVersion}`;
  const codename = entry.internalCodename || 'N/A';
  const releaseDate = formatDate(entry.releaseDate);

  const message =
    `新版本：${version}\n` +
    `内部代号：${codename}\n` +
    `发布日期：${releaseDate}\n\n` +
    `请前往 GitHub 下载更新：\n${releaseUrl}`;

  dialog.showMessageBox({
    type: 'info',
    title: '发现新版本',
    message: message,
    buttons: ['我知道了'],
    defaultId: 0
  });
}

/**
 * 显示“重启确认”对话框
 */
function showRestartDialog(targetVersion, entry, onRestart, onLater, onTimeout) {
  const version = entry.version || `v${targetVersion}`;
  const codename = entry.internalCodename || 'N/A';
  const releaseDate = formatDate(entry.releaseDate);

  const message =
    `更新已准备就绪：${version}\n` +
    `内部代号：${codename}\n` +
    `发布日期：${releaseDate}\n\n` +
    `是否立即重启应用完成更新？`;

  dialog.showMessageBox({
    type: 'info',
    title: '更新准备就绪',
    message: message,
    buttons: ['立即重启', '稍后'],
    defaultId: 0,
    cancelId: 1
  }).then(result => {
    if (result.response === 0) onRestart();
    else onLater();
  });

  // 超时处理：30 秒后自动视为“稍后”
  setTimeout(() => {
    onTimeout();
  }, 30000);
}

async function performUpdate(onProgress, onComplete) {
  if (isUpdating) {
    console.warn('[Updater] Update already in progress');
    onComplete && onComplete(false, 'Update already in progress');
    return;
  }
  isUpdating = true;
  let tempDir = null;
  let isManualDir = false;
  let zipPath = null;

  try {
    if (updateDisabled) {
      console.log('[Updater] Update disabled, skipping');
      onComplete && onComplete(false, 'Update disabled');
      isUpdating = false;
      return;
    }

    onProgress && onProgress('Checking version...', 0);
    const checkResult = await checkForUpdates();
    if (checkResult.error) {
      console.error('[Updater] Version check failed:', checkResult.error);
      onComplete && onComplete(false, checkResult.error);
      isUpdating = false;
      return;
    }
    if (!checkResult.hasUpdate) {
      console.log('[Updater] Already up to date');
      onComplete && onComplete(true, null);
      isUpdating = false;
      return;
    }

    const { currentVersion, latestVersion, zipUrl, manifestUrl } = checkResult;
    console.log('[Updater] New version found:', latestVersion);

    // 读取用户配置
    const Store = require('electron-store');
    const store = new Store({ name: 'sparklet-data' });
    const updateBehavior = store.get('updateBehavior') || 'auto';

    if (updateBehavior === 'disabled') {
      console.log('[Updater] User disabled updates');
      onComplete && onComplete(true, null);
      isUpdating = false;
      return;
    }

    // 先获取 manifest 信息（用于弹窗展示）
    onProgress && onProgress('Fetching update metadata...', 3);
    const manifestResult = await verifyReleaseManifest(manifestUrl, `v${latestVersion}`);
    if (!manifestResult.success) {
      onComplete && onComplete(false, manifestResult.error);
      isUpdating = false;
      return;
    }
    const entry = manifestResult.entry;

    if (updateBehavior === 'notify-only') {
      const releaseUrl = `https://github.com/TRR-a/sparklet/releases/tag/v${latestVersion}`;
      showNotifyOnlyDialog(currentVersion, entry, releaseUrl);
      onComplete && onComplete(true, null);
      isUpdating = false;
      return;
    }

    // 询问用户
    let userConfirmed = false;
    await new Promise((resolve) => {
      showUpdateDialog(currentVersion, entry, () => {
        userConfirmed = true;
        resolve();
      }, () => {
        userConfirmed = false;
        resolve();
      });
    });
    if (!userConfirmed) {
      console.log('[Updater] User cancelled update');
      onComplete && onComplete(true, null);
      isUpdating = false;
      return;
    }

    // 获取临时目录
    onProgress && onProgress('Preparing temp directory...', 5);
    const tempResult = await acquireTempDir();
    if (!tempResult.success) {
      onComplete && onComplete(false, 'Unable to acquire temp directory');
      isUpdating = false;
      return;
    }
    tempDir = tempResult.path;
    isManualDir = tempResult.isManual;
    console.log('[Updater] Using temp directory:', tempDir);

    // 下载
    onProgress && onProgress('Downloading update package...', 10);
    const zipFileName = `Sparklet-v${latestVersion}.zip`;
    zipPath = path.join(tempDir, zipFileName);

    const downloadResult = await downloadWithRetry(zipUrl, zipPath, (percent) => {
      const progress = 10 + Math.round(percent * 0.5);
      onProgress && onProgress(`Downloading... ${percent}%`, progress);
    }, MAX_RETRY_COUNT);
    if (!downloadResult.success) {
      await releaseTempDir(tempDir, isManualDir);
      onComplete && onComplete(false, downloadResult.error);
      isUpdating = false;
      return;
    }

    // 第二层校验：SHA256
    onProgress && onProgress('Verifying file integrity...', 80);
    const expectedHash = entry.hash;
    const integrityResult = await verifyPackageIntegrity(zipPath, expectedHash);
    if (!integrityResult.success) {
      await fs.remove(zipPath).catch(() => {});
      await releaseTempDir(tempDir, isManualDir);
      onComplete && onComplete(false, integrityResult.error);
      isUpdating = false;
      return;
    }

    // 重启确认
    onProgress && onProgress('Ready to install...', 90);
    let restartConfirmed = false;
    let laterConfirmed = false;
    let timeoutOccurred = false;

    await new Promise((resolve) => {
      showRestartDialog(latestVersion, entry, () => {
        restartConfirmed = true;
        resolve();
      }, () => {
        laterConfirmed = true;
        resolve();
      }, () => {
        timeoutOccurred = true;
        laterConfirmed = true;
        resolve();
      });
    });

    if (laterConfirmed) {
      pendingUpdate = { zipPath, tempDir, isManualDir, targetVersion: latestVersion };
      console.log('[Updater] User chose later, update will be applied on app exit');
      onComplete && onComplete(true, null);
      isUpdating = false;
      return;
    }

    // 执行安装
    onProgress && onProgress('Installing update...', 95);
    const installResult = await installUpdate(zipPath, tempDir, latestVersion, (msg, pct) => {
      onProgress && onProgress(msg, 95 + Math.round(pct * 0.05));
    });
    if (!installResult.success) {
      await releaseTempDir(tempDir, isManualDir);
      onComplete && onComplete(false, installResult.error);
      isUpdating = false;
      return;
    }

    onProgress && onProgress('Update complete, restarting...', 100);
    pendingUpdate = null;
    isUpdating = false;
    setTimeout(() => app.quit(), 500);
    onComplete && onComplete(true, null);

  } catch (err) {
    console.error('[Updater] Update process error:', err);
    if (zipPath) await fs.remove(zipPath).catch(() => {});
    if (tempDir) await releaseTempDir(tempDir, isManualDir);
    isUpdating = false;
    onComplete && onComplete(false, err.message || 'Unknown error');
  }
}

async function checkPendingUpdate() {
  if (!pendingUpdate) return false;
  console.log('[Updater] Pending update detected, applying...');
  const { zipPath, tempDir, isManualDir, targetVersion } = pendingUpdate;
  const result = await installUpdate(zipPath, tempDir, targetVersion);
  if (result.success) {
    pendingUpdate = null;
    setTimeout(() => app.quit(), 500);
    return true;
  } else {
    console.error('[Updater] Pending update failed:', result.error);
    await releaseTempDir(tempDir, isManualDir);
    pendingUpdate = null;
    return false;
  }
}

function initUpdater() {
  checkDisableFlags();
  selfCheckIntegrity().then(result => {
    if (!result.success) {
      console.warn('[Updater] Integrity self-check warning:', result.error);
    }
  });
  if (pendingUpdate) {
    console.log('[Updater] Pending update found, will install on app exit');
  }
  app.on('before-quit', async (event) => {
    if (pendingUpdate) {
      event.preventDefault();
      await checkPendingUpdate();
    }
  });
  console.log('[Updater] Update module initialized');
}

function checkUpdateManually() {
  if (updateDisabled) {
    console.log('[Updater] Update disabled, cannot check manually');
    return;
  }
  performUpdate(
    (msg, percent) => console.log(`[Updater] Progress: ${msg} (${percent}%)`),
    (success, error) => {
      if (success) {
        console.log('[Updater] Update completed');
      } else {
        console.error('[Updater] Update failed:', error);
        dialog.showMessageBox({
          type: 'error',
          title: '更新失败',
          message: error || '更新失败，请检查网络或手动去 GitHub 下载'
        });
      }
    }
  );
}

module.exports = {
  initUpdater,
  checkUpdateManually,
  checkPendingUpdate,
  performUpdate,
  get isUpdating() { return isUpdating; },
  get pendingUpdate() { return pendingUpdate; },
  get updateDisabled() { return updateDisabled; }
};