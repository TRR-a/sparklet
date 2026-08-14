// Updater IPC handlers [更新模块 IPC 处理器]
// Handles update check, status, dev environment detection, and external link opening [处理更新检查、状态、开发环境检测、外链打开]

import { ipcMain, app, shell } from 'electron';
import { checkUpdateManually, updaterState } from '../updater';
import { getCurrentVersion } from '../updater/check';

// Project official URL (GitHub repository homepage) [项目官网地址 (GitHub 仓库主页)]
const PROJECT_OFFICIAL_URL = 'https://github.com/TRR-a/sparklet';

/**
 * Register updater IPC handlers (check, status, dev, external links) [注册更新模块 IPC 处理器 (检查、状态、开发环境、外链)]
 */
export function registerUpdaterIpcHandlers(): void {
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

  // ========== App version [应用版本] ==========
  ipcMain.handle('app:get-version', () => {
    return getCurrentVersion();
  });

  // ========== Open official site [打开官网] ==========
  ipcMain.handle('app:open-official-site', async () => {
    try {
      await shell.openExternal(PROJECT_OFFICIAL_URL);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Main] Open official site failed:', msg);
      return { success: false, error: msg };
    }
  });

  // ========== Open arbitrary external link [打开任意外链] ==========
  ipcMain.handle('app:open-external', async (_evt, url: string) => {
    const u = String(url || '').trim();
    if (!u) return { success: false, error: 'empty url' };
    // Only allow http/https protocol (prevent security risks) [仅允许 http/https 协议 (防止安全风险)]
    if (!/^https?:\/\//i.test(u)) {
      return { success: false, error: 'protocol not allowed' };
    }
    try {
      await shell.openExternal(u);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Main] Open external URL failed:', u, msg);
      return { success: false, error: msg };
    }
  });
}
