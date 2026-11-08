// Updater config import from JSON file [更新配置从 JSON 文件导入]
//
// Split out [已拆分]：validation/merge → updater-config-import-rules.ts,
// file picker → updater-config-import-dialog.ts,
// file reading → updater-config-import-read.ts,
// retention cleanup → updater-config-import-cleanup.ts.

import { ipcMain } from 'electron';
import { readConfig, writeConfig } from '../../../updater/config/config-manager.js';
import { mergeImportedConfig, extractConfigPayload } from './updater-config-import-rules.js';
import { pickConfigFileForImport } from './updater-config-import-dialog.js';
import { readImportedPayload } from './updater-config-import-read.js';
import { scheduleRetentionCleanup } from './updater-config-import-cleanup.js';

/**
 * Register import-file handler [注册导入文件处理器]
 */
export function registerUpdaterConfigImportHandler(): void {
  // ========== Import config from JSON file [导入配置] ==========
  ipcMain.handle('updater-config:import-file', async () => {
    try {
      const file = await pickConfigFileForImport();
      if (!file) {
        return { success: true, canceled: true };
      }

      const read = await readImportedPayload(file);
      if (!read.payload) {
        return { success: false, error: read.error };
      }

      const raw = extractConfigPayload(read.payload);
      if (typeof raw !== 'object' || Array.isArray(raw)) {
        return { success: false, error: '配置格式错误，顶层必须是 JSON 对象' };
      }

      const base = await readConfig();
      const merged = mergeImportedConfig(raw, base);

      await writeConfig(merged);

      if (typeof merged.cacheRetentionDays === 'number') {
        scheduleRetentionCleanup(merged.cacheRetentionDays);
      }

      return { success: true, config: merged };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Main] Import updater config failed:', msg);
      return { success: false, error: msg };
    }
  });
}
