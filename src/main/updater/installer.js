// src/main/updater/installer.js
// Installer: always dispatch external updater (directReplace removed: asar archives are read-only
// and cannot be patched in-place inside a running app; all updates apply after main quits).

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');
const { getUpdaterScriptPath, getTempPath } = require('./constants');

async function runExternalUpdater(zipPath, tempDir, targetVersion) {
  const updaterScript = getUpdaterScriptPath();
  const exists = await fs.pathExists(updaterScript);
  if (!exists) {
    console.error('[Installer] Updater script not found:', updaterScript);
    return { success: false, error: `Updater script not found: ${updaterScript}` };
  }

  // Prepare persistent log location (inside userData so user can find it easily)
  const logDir = path.join(app.getPath('userData'), 'update_logs');
  await fs.ensureDir(logDir);
  const ts = new Date();
  const tsStr =
    ts.getFullYear().toString()
    + String(ts.getMonth() + 1).padStart(2, '0')
    + String(ts.getDate()).padStart(2, '0') + '-'
    + String(ts.getHours()).padStart(2, '0')
    + String(ts.getMinutes()).padStart(2, '0')
    + String(ts.getSeconds()).padStart(2, '0');
  const safeVersion = (targetVersion || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
  const logFile = path.join(logDir, `updater-${safeVersion}-${tsStr}.log`);
  console.log('[Installer] Updater log will be written to:', logFile);

  console.log('[Installer] Starting external updater:', updaterScript);
  return new Promise((resolve) => {
    // ELECTRON_RUN_AS_NODE=1 让 Electron 打包后的 exe 以纯 Node 模式运行 js 文件
    const nodeProcess = spawn(process.execPath, [
      updaterScript,
      '--zip', zipPath,
      '--temp', tempDir,
      '--version', targetVersion,
      '--pid', process.pid,
      '--log-file', logFile
    ], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    nodeProcess.unref();
    setTimeout(() => {
      console.log('[Installer] External updater started, main process will exit');
      resolve({ success: true, error: null, logFile });
    }, 1000);
  });
}

async function installUpdate(zipPath, tempDir, targetVersion, onProgress = null) {
  onProgress && onProgress('Starting external updater...', 50);
  console.log('[Installer] Package analysis skipped, always using external updater (asar-safe)');
  return runExternalUpdater(zipPath, tempDir, targetVersion);
}

module.exports = {
  runExternalUpdater,
  installUpdate
};