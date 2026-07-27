// src/main/updater/temp-manager.js
// Temp directory management: acquire, clean, release

const fs = require('fs-extra');
const path = require('path');
const { app, dialog } = require('electron');
const { TEMP_DIR_NAMES, getTempPath } = require('./constants');

async function cleanDirectory(dirPath) {
  try {
    const exists = await fs.pathExists(dirPath);
    if (!exists) return true;
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      await fs.remove(itemPath);
    }
    return true;
  } catch (err) {
    console.error('[TempManager] Clean directory failed:', dirPath, err.message);
    return false;
  }
}

async function acquireTempDir() {
  const tempBase = getTempPath();
  for (const dirName of TEMP_DIR_NAMES) {
    const fullPath = path.join(tempBase, dirName);
    try {
      const exists = await fs.pathExists(fullPath);
      if (!exists) {
        await fs.ensureDir(fullPath);
        console.log('[TempManager] Created temp directory:', fullPath);
        return { success: true, path: fullPath, isManual: false };
      } else {
        const cleaned = await cleanDirectory(fullPath);
        if (cleaned) {
          console.log('[TempManager] Reused and cleaned temp directory:', fullPath);
          return { success: true, path: fullPath, isManual: false };
        }
        console.warn('[TempManager] Clean failed, trying next:', fullPath);
      }
    } catch (err) {
      console.error('[TempManager] Access error:', fullPath, err.message);
    }
  }

  console.error('[TempManager] All candidate directories unavailable');
  const result = await dialog.showMessageBox({
    type: 'warning',
    title: 'Update Temp Directory Error',
    message: 'Unable to create or clean temp directory. Please manually clean Sparklet-* or sparklet-* folders in %TEMP%, or specify an empty directory as update cache.',
    buttons: ['Retry', 'Specify Manually', 'Cancel'],
    defaultId: 0,
    cancelId: 2
  });

  if (result.response === 0) {
    return acquireTempDir();
  } else if (result.response === 1) {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Empty Directory as Update Cache',
      properties: ['openDirectory', 'createDirectory']
    });
    if (canceled || filePaths.length === 0) {
      return { success: false, path: null, isManual: false };
    }
    const manualPath = filePaths[0];
    try {
      const items = await fs.readdir(manualPath);
      if (items.length > 0) {
        const confirm = await dialog.showMessageBox({
          type: 'warning',
          title: 'Directory Not Empty',
          message: 'Selected directory is not empty. Continue? (It will be cleaned after update)',
          buttons: ['Continue', 'Reselect'],
          defaultId: 0,
          cancelId: 1
        });
        if (confirm.response === 1) return acquireTempDir();
        await cleanDirectory(manualPath);
      }
    } catch (err) {
      console.error('[TempManager] Manual dir check failed:', err.message);
      return { success: false, path: null, isManual: false };
    }
    console.log('[TempManager] Using manually specified temp directory:', manualPath);
    return { success: true, path: manualPath, isManual: true };
  } else {
    return { success: false, path: null, isManual: false };
  }
}

async function releaseTempDir(dirPath, isManual = false) {
  if (!dirPath) return;
  try {
    if (isManual) {
      await fs.remove(dirPath);
      console.log('[TempManager] Removed manual temp directory:', dirPath);
    } else {
      await cleanDirectory(dirPath);
      console.log('[TempManager] Cleaned temp directory:', dirPath);
    }
  } catch (err) {
    console.error('[TempManager] Release failed:', dirPath, err.message);
  }
}

module.exports = { acquireTempDir, releaseTempDir, cleanDirectory };