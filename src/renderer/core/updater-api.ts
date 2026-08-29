// Core self-updater API (renderer side) [核心自更新 API (渲染侧)]
// Wraps updater flow, updater config, update-cache and updater dialog/toast channels [封装更新流程、更新配置、更新缓存及更新弹窗/Toast 通道]

import { bus } from './ipc-bus.js';
import type { UpdaterConfig, CacheInfo, ToastData, DialogPayload } from '../../shared/types/updater.js';

export const updaterApi = {
  // ---------- Update flow [更新流程] ----------
  checkUpdate(): Promise<{ started: boolean }> {
    return bus.invoke('updater:check');
  },
  getUpdateStatus(): Promise<{ isUpdating: boolean }> {
    return bus.invoke('updater:status');
  },
  checkUpdateNow(): Promise<{ started: boolean }> {
    return bus.invoke('updater:check-now');
  },
  getUpdaterStatus(): Promise<{ isUpdating: boolean; isChecking: boolean; updateDisabled: boolean }> {
    return bus.invoke('updater:get-status');
  },

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

  // ---------- Update cache [更新缓存] ----------
  getCacheInfo(): Promise<{ success: boolean; info?: CacheInfo; error?: string }> {
    return bus.invoke('update-cache:get-info');
  },
  clearCache(): Promise<{ success: boolean; error?: string }> {
    return bus.invoke('update-cache:clear-all');
  },
  getCacheRetentionDays(): Promise<{ success: boolean; days?: number; error?: string }> {
    return bus.invoke('update-cache:get-retention-days');
  },
  setCacheRetentionDays(days: number): Promise<{ success: boolean; days?: number; error?: string }> {
    return bus.invoke('update-cache:set-retention-days', days);
  },

  // ---------- Update events [更新事件] ----------
  onStatusChange(callback: (data: { checking?: boolean; done?: boolean; error?: string }) => void): () => void {
    return bus.on('updater:status-change', (data) => callback(data as { checking?: boolean; done?: boolean; error?: string }));
  },
  onProgress(callback: (data: { msg?: string; percent?: number }) => void): () => void {
    return bus.on('updater:progress', (data) => callback(data as { msg?: string; percent?: number }));
  },

  // ---------- Custom updater dialog [自定义更新弹窗] ----------
  onDialogShow(callback: (payload: DialogPayload) => void): () => void {
    return bus.on('updater:dialog-show', (payload) => callback(payload as DialogPayload));
  },
  sendDialogResponse(dialogId: string, response: { buttonIndex: number;[key: string]: unknown }): Promise<{ ok: boolean }> {
    return bus.invoke('updater:dialog-response', { dialogId, response });
  },

  // ---------- Toast [Toast 提示] ----------
  onToastShow(callback: (data: ToastData) => void): () => void {
    return bus.on('toast:show', (data) => callback(data as ToastData));
  },
};
