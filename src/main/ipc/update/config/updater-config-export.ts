// Updater config export to JSON file [更新配置导出为 JSON 文件]

import { ipcMain, app, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs-extra';
import { readConfig } from '../../../updater/config/config-manager.js';

/**
 * Register export-file handler [注册导出文件处理器]
 */
export function registerUpdaterConfigExportHandler(): void {
  // ========== Export config to JSON file [导出配置为 JSON 文件] ==========
  ipcMain.handle('updater-config:export-file', async () => {
    try {
      const cfg = await readConfig();
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      const defaultName = `sparklet-updater-config-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)}.json`;
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: '导出更新配置',
        defaultPath: defaultName,
        filters: [{ name: 'JSON 配置', extensions: ['json'] }]
      });
      if (canceled || !filePath) {
        return { success: true, canceled: true };
      }
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: app.getVersion(),
        config: cfg
      };
      await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
      return { success: true, filePath };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Main] Export updater config failed:', msg);
      return { success: false, error: msg };
    }
  });
}
