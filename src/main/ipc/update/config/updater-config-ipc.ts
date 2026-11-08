// Updater config IPC handlers [更新配置 IPC 处理器]
// Handles updater config read/write/get/set, interval/behavior queries [处理更新配置读写、频率/行为查询]
// Export handler in updater-config-export.ts, import handler in updater-config-import.ts [导出处理器在 updater-config-export.ts，导入处理器在 updater-config-import.ts]

import { ipcMain } from 'electron';
import {
  readConfig,
  writeConfig,
  getConfigItem,
  setConfigItem,
  getCheckInterval,
  getUpdateBehavior
} from '../../../updater/config/config-manager.js';
import type { UpdaterConfig } from 'sparklet/shared/types/updater/updater.js';
import { registerUpdaterConfigExportHandler } from './updater-config-export.js';
import { registerUpdaterConfigImportHandler } from './updater-config-import.js';

/**
 * Register updater config IPC handlers [注册更新配置 IPC 处理器]
 */
export function registerUpdaterConfigIpcHandlers(): void {
  // ========== Config read/write [配置读写] ==========
  ipcMain.handle('updater-config:read', async () => {
    return readConfig();
  });

  ipcMain.handle('updater-config:write', async (_event, config: UpdaterConfig) => {
    return writeConfig(config);
  });

  ipcMain.handle('updater-config:get', async (_event, key: keyof UpdaterConfig) => {
    return getConfigItem(key);
  });

  ipcMain.handle('updater-config:set', async (_event, key: keyof UpdaterConfig, value: unknown) => {
    return setConfigItem(key, value);
  });

  ipcMain.handle('updater-config:getInterval', async () => {
    return getCheckInterval();
  });

  ipcMain.handle('updater-config:getBehavior', async () => {
    return getUpdateBehavior();
  });

  registerUpdaterConfigExportHandler();
  registerUpdaterConfigImportHandler();
}
