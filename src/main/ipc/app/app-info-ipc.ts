// App IPC: version / official site / external links [应用 IPC - 版本、官网、外链]

import { ipcMain, shell } from 'electron';
import { getCurrentVersion } from '../../updater/check/check.js';

// Project official URL (GitHub repository homepage) [项目官网地址 (GitHub 仓库主页)]
const PROJECT_OFFICIAL_URL = 'https://github.com/TRR-a/sparklet';

/**
 * Register app-level info & external link handlers [注册应用级信息与外链处理器]
 */
export function registerAppInfoIpc(): void {
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
