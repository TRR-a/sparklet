// Store IPC handlers [存储 IPC 处理器]
// Handles electron-store get/set for app-level config (language, theme, migration flags) [处理 electron-store 读写，用于应用级配置 (语言、主题、迁移标记)]

import { ipcMain } from 'electron';
import { store } from '../services/store';

/**
 * Register store IPC handlers (kept for other config, notes already migrated to file system) [注册存储 IPC 处理器 (保留用于其他配置，笔记已迁移至文件系统)]
 */
export function registerStoreIpcHandlers(): void {
  ipcMain.handle('store:get', async (_event, key: string) => {
    return store.get(key);
  });

  ipcMain.handle('store:set', async (_event, key: string, value: unknown) => {
    store.set(key, value);
  });
}
