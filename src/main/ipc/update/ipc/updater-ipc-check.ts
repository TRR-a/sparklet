// Updater IPC: check / status / dev detection [更新 IPC - 检查、状态、开发环境]

import { ipcMain, app } from 'electron';
import { checkUpdateManually, updaterState } from 'sparklet/main/updater/index.js';

/**
 * Register updater check-related handlers [注册更新检查相关处理器]
 */
export function registerUpdaterCheckIpc(): void {
  // ========== Updater check [更新检查] ==========
  ipcMain.handle('updater:check', async () => {
    checkUpdateManually();
    return { started: true };
  });

  ipcMain.handle('updater:status', async () => {
    return { isUpdating: updaterState.isUpdating };
  });

  // ========== Manual check [手动检查] ==========
  ipcMain.handle('updater:check-now', async () => {
    checkUpdateManually();
    return { started: true };
  });

  // ========== Get updater status [获取更新状态] ==========
  ipcMain.handle('updater:get-status', async () => {
    return {
      isUpdating: updaterState.isUpdating,
      isChecking: updaterState.isChecking,
      updateDisabled: updaterState.updateDisabled
    };
  });

  // ========== Dev environment detection [开发环境检测] ==========
  ipcMain.handle('updater:is-dev', async () => {
    return !app.isPackaged;
  });
}
