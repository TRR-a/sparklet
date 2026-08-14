// Updater config IPC handlers [更新配置 IPC 处理器]
// Handles updater config read/write/get/set, interval/behavior queries, and config file export/import [处理更新配置读写、频率/行为查询、配置文件导入导出]

import { ipcMain, app, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs-extra';
import {
  readConfig,
  writeConfig,
  getConfigItem,
  setConfigItem,
  getCheckInterval,
  getUpdateBehavior
} from '../updater/config-manager';
import * as cacheManager from '../updater/cache-manager';
import {
  CACHE_RETENTION_MIN_DAYS,
  CACHE_RETENTION_MAX_DAYS,
  DEFAULT_CACHE_SUCCESS_RETENTION_DAYS,
  DEFAULT_CONFIG,
  INTERVAL_OPTIONS
} from '../updater/constants';
import type { UpdaterConfig } from '../../shared/types/updater';

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
      await fs.writeJson(filePath, payload, { spaces: 2 });
      return { success: true, filePath };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Main] Export updater config failed:', msg);
      return { success: false, error: msg };
    }
  });

  // ========== Import config from JSON file [导入配置] ==========
  ipcMain.handle('updater-config:import-file', async () => {
    const ALLOWED_BEHAVIORS = new Set(['auto', 'notify-only', 'disabled']);
    const LEGAL_INTERVALS = new Set(INTERVAL_OPTIONS.map(o => o.value).concat([0]));
    const WHITE_LIST = new Set(Object.keys(DEFAULT_CONFIG));

    try {
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: '导入更新配置',
        properties: ['openFile'],
        filters: [{ name: 'JSON 配置', extensions: ['json'] }]
      });
      if (canceled || !filePaths || filePaths.length === 0) {
        return { success: true, canceled: true };
      }
      const file = filePaths[0];
      let payload: Record<string, unknown>;
      try {
        payload = await fs.readJson(file);
      } catch (parseErr) {
        const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        return { success: false, error: '文件不是合法的 JSON：' + msg };
      }

      const raw = payload && payload.config && typeof payload.config === 'object' ? payload.config as Record<string, unknown> : (payload || {});
      if (typeof raw !== 'object' || Array.isArray(raw)) {
        return { success: false, error: '配置格式错误，顶层必须是 JSON 对象' };
      }

      const base = await readConfig();
      const merged: UpdaterConfig = { ...base };

      for (const key of Object.keys(raw)) {
        if (!WHITE_LIST.has(key)) continue;
        const v = raw[key];
        switch (key) {
          case 'updateBehavior':
            if (ALLOWED_BEHAVIORS.has(String(v))) {
              merged.updateBehavior = String(v) as UpdaterConfig['updateBehavior'];
            }
            break;
          case 'checkInterval': {
            const n = Number(v);
            if (Number.isFinite(n) && LEGAL_INTERVALS.has(n)) merged.checkInterval = n;
            break;
          }
          case 'autoDownload':
            merged.autoDownload = !!v;
            break;
          case 'integrityCheck':
            merged.integrityCheck = !!v;
            break;
          case 'cacheRetentionDays': {
            const n = Number(v);
            if (Number.isFinite(n)) {
              merged.cacheRetentionDays = Math.max(
                CACHE_RETENTION_MIN_DAYS,
                Math.min(CACHE_RETENTION_MAX_DAYS, Math.round(n))
              );
            }
            break;
          }
          case 'lastCheckTime':
            if (v === null || v === undefined) {
              merged.lastCheckTime = null;
            } else {
              const t = new Date(v as string).getTime();
              if (Number.isFinite(t)) merged.lastCheckTime = new Date(t).toISOString();
            }
            break;
          default:
            // Skip unknown keys [跳过未知键]
            break;
        }
      }

      await writeConfig(merged);

      if (typeof merged.cacheRetentionDays === 'number') {
        setImmediate(() => {
          cacheManager.cleanupExpired(merged.cacheRetentionDays).catch(e => {
            const msg = e instanceof Error ? e.message : String(e);
            console.warn('[Main] Import retention changed, cleanup failed (non-critical):', msg);
          });
        });
      }

      return { success: true, config: merged };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Main] Import updater config failed:', msg);
      return { success: false, error: msg };
    }
  });
}
