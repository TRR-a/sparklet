// src/main/updater/installer.js
// Installer: dispatch external updater or direct replace

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');
const { getUpdaterScriptPath, getTempPath } = require('./constants');

async function checkIfContainsMain(zipPath, extractDir) {
  const unzipper = require('unzipper');
  try {
    const entries = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(zipPath)
        .pipe(unzipper.Parse())
        .on('entry', (entry) => {
          results.push(entry.path);
          entry.autodrain();
        })
        .on('error', reject)
        .on('finish', () => resolve(results));
    });
    const containsMain = entries.some(name => name.startsWith('src/main/'));
    return { containsMain, error: null };
  } catch (err) {
    return { containsMain: false, error: `Failed to inspect package: ${err.message}` };
  }
}

async function runExternalUpdater(zipPath, tempDir, targetVersion) {
  const updaterScript = getUpdaterScriptPath();
  const exists = await fs.pathExists(updaterScript);
  if (!exists) {
    console.error('[Installer] Updater script not found:', updaterScript);
    return { success: false, error: `Updater script not found: ${updaterScript}` };
  }
  console.log('[Installer] Starting external updater:', updaterScript);
  return new Promise((resolve) => {
    const nodeProcess = spawn(process.execPath, [
      updaterScript,
      '--zip', zipPath,
      '--temp', tempDir,
      '--version', targetVersion,
      '--pid', process.pid
    ], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    nodeProcess.unref();
    setTimeout(() => {
      console.log('[Installer] External updater started, main process will exit');
      resolve({ success: true, error: null });
    }, 1000);
  });
}

async function directReplace(zipPath, extractDir) {
  const unzipper = require('unzipper');
  const appRoot = require('./constants').getAppRoot();
  try {
    await fs.ensureDir(extractDir);
    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .on('error', reject)
        .on('finish', resolve);
    });
    console.log('[Installer] Extracted, performing direct replace (renderer/assets only)');
    const srcDir = path.join(extractDir, 'src');
    const assetsDir = path.join(extractDir, 'assets');
    const targetSrc = path.join(appRoot, 'src');
    const targetAssets = path.join(appRoot, 'assets');
    const rendererSrc = path.join(srcDir, 'renderer');
    const rendererTarget = path.join(targetSrc, 'renderer');
    if (await fs.pathExists(rendererSrc)) {
      await fs.copy(rendererSrc, rendererTarget, { overwrite: true });
      console.log('[Installer] Updated renderer directory');
    }
    if (await fs.pathExists(assetsDir)) {
      await fs.copy(assetsDir, targetAssets, { overwrite: true });
      console.log('[Installer] Updated assets directory');
    }
    await fs.remove(extractDir);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: `Direct replace failed: ${err.message}` };
  }
}

async function installUpdate(zipPath, tempDir, targetVersion, onProgress = null) {
  onProgress && onProgress('Analyzing package...', 0);
  const extractDir = path.join(tempDir, 'extracted');
  const { containsMain, error } = await checkIfContainsMain(zipPath, extractDir);
  if (error) return { success: false, error };
  if (containsMain) {
    onProgress && onProgress('Starting external updater...', 50);
    console.log('[Installer] Package contains main process, using external updater');
    return runExternalUpdater(zipPath, tempDir, targetVersion);
  } else {
    onProgress && onProgress('Replacing files directly...', 50);
    console.log('[Installer] Package only renderer/assets, direct replace');
    return directReplace(zipPath, extractDir);
  }
}

module.exports = {
  checkIfContainsMain,
  runExternalUpdater,
  directReplace,
  installUpdate
};