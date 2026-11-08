// Updater API: config read/write [更新 API - 配置读写]

import { bus } from '../../ipc/ipc-bus.js';
import type { UpdaterConfig } from 'sparklet/shared/types/updater/updater.js';

export const updaterApiConfig = {
  // ---------- Updater config [更新配置] ----------
  getConfig(): Promise<UpdaterConfig> {
    return bus.invoke('updater-config:read');
  },
  setConfig(config: UpdaterConfig): Promise<{ success: boolean; error?: string }> {
    return bus.invoke('updater-config:write', config);
  },
  getConfigItem(key: string): Promise<unknown> {
    return bus.invoke('updater-config:get', key);
  },
  setConfigItem(key: string, value: unknown): Promise<{ success: boolean; error?: string }> {
    return bus.invoke('updater-config:set', key, value);
  },
  exportConfig(): Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }> {
    return bus.invoke('updater-config:export-file');
  },
  importConfig(): Promise<{ success: boolean; canceled?: boolean; config?: UpdaterConfig; error?: string }> {
    return bus.invoke('updater-config:import-file');
  },
};
