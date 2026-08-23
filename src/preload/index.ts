// Preload script - securely exposes APIs to renderer process [预加载脚本 - 安全暴露 API 给渲染进程]
// Compiled with CommonJS (main process config) [使用 CommonJS 编译 (主进程配置)]

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type {
  ElectronStoreAPI,
  NotesAPI,
  ElectronAPI,
} from '../shared/types/ipc';
import type { Note, NoteListResult, NoteGetResult, NoteSaveResult, NoteOperationResult } from '../shared/types/notes';
import type { UpdaterConfig, CacheInfo, ToastData, DialogPayload, DialogResponse } from '../shared/types/updater';
import type { ProjectAPI, ProjectOpenResult, ProjectTreeResult, ProjectFileReadResult } from '../shared/types/project';

// ========== Expose local storage API (config class, notes already migrated to file system) [暴露本地存储 API (配置类，笔记类已迁移至文件系统)] ==========
const electronStoreApi: ElectronStoreAPI = {
  get: (key: string) => ipcRenderer.invoke('store:get', key),
  set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
};

// ========== Expose notes file system API [暴露笔记文件系统 API] ==========
const notesApi: NotesAPI = {
  list: () => ipcRenderer.invoke('notes:list') as Promise<NoteListResult>,
  get: (id: string) => ipcRenderer.invoke('notes:get', id) as Promise<NoteGetResult>,
  save: (note: Note) => ipcRenderer.invoke('notes:save', note) as Promise<NoteSaveResult>,
  delete: (id: string) => ipcRenderer.invoke('notes:delete', id) as Promise<NoteOperationResult>,
  restore: (id: string) => ipcRenderer.invoke('notes:restore', id) as Promise<NoteOperationResult>,
  permanentDelete: (id: string) => ipcRenderer.invoke('notes:permanentDelete', id) as Promise<NoteOperationResult>,
};

// ========== Expose general IPC communication API [暴露通用 IPC 通信 API] ==========
const electronApi: ElectronAPI = {
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  // Updater [更新模块]
  checkUpdate: () => ipcRenderer.invoke('updater:check') as Promise<{ started: boolean }>,
  getUpdateStatus: () => ipcRenderer.invoke('updater:status') as Promise<{ isUpdating: boolean }>,

  // Updater config [更新配置]
  getUpdaterConfig: () => ipcRenderer.invoke('updater-config:read') as Promise<UpdaterConfig>,
  setUpdaterConfig: (config: UpdaterConfig) =>
    ipcRenderer.invoke('updater-config:write', config) as Promise<{ success: boolean; error?: string }>,
  getUpdaterConfigItem: (key: string) => ipcRenderer.invoke('updater-config:get', key),
  setUpdaterConfigItem: (key: string, value: unknown) =>
    ipcRenderer.invoke('updater-config:set', key, value) as Promise<{ success: boolean; error?: string }>,
  exportUpdaterConfig: () =>
    ipcRenderer.invoke('updater-config:export-file') as Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>,
  importUpdaterConfig: () =>
    ipcRenderer.invoke('updater-config:import-file') as Promise<{ success: boolean; canceled?: boolean; config?: UpdaterConfig; error?: string }>,
  checkUpdateNow: () => ipcRenderer.invoke('updater:check-now') as Promise<{ started: boolean }>,
  getUpdaterStatus: () =>
    ipcRenderer.invoke('updater:get-status') as Promise<{ isUpdating: boolean; isChecking: boolean; updateDisabled: boolean }>,
  onUpdaterStatusChange: (callback: (data: { checking?: boolean; done?: boolean; error?: string }) => void) => {
    ipcRenderer.on('updater:status-change', (_event: IpcRendererEvent, data: { checking?: boolean; done?: boolean; error?: string }) => callback(data));
  },
  onUpdaterProgress: (callback: (data: { msg?: string; percent?: number }) => void) => {
    ipcRenderer.on('updater:progress', (_event: IpcRendererEvent, data: { msg?: string; percent?: number }) => callback(data));
  },

  // Toast events [Toast 事件]
  onToastShow: (callback: (data: ToastData) => void) => {
    ipcRenderer.on('toast:show', (_event: IpcRendererEvent, data: ToastData) => callback(data));
  },

  // Dev environment, config changes, official site [开发环境检测、配置变化、官网]
  isDev: () => ipcRenderer.invoke('updater:is-dev') as Promise<boolean>,
  onConfigChanged: (callback: (config: UpdaterConfig) => void) => {
    ipcRenderer.on('config:changed', (_event: IpcRendererEvent, config: UpdaterConfig) => callback(config));
  },
  openOfficialSite: () =>
    ipcRenderer.invoke('app:open-official-site') as Promise<{ success: boolean; error?: string }>,

  // App version [应用版本]
  getAppVersion: () => ipcRenderer.invoke('app:get-version') as Promise<string>,

  // Update cache management (for settings page) [更新包缓存管理 (设置页用)]
  getUpdateCacheInfo: () =>
    ipcRenderer.invoke('update-cache:get-info') as Promise<{ success: boolean; info?: CacheInfo; error?: string }>,
  clearUpdateCache: () =>
    ipcRenderer.invoke('update-cache:clear-all') as Promise<{ success: boolean; error?: string }>,
  getCacheRetentionDays: () =>
    ipcRenderer.invoke('update-cache:get-retention-days') as Promise<{ success: boolean; days?: number; error?: string }>,
  setCacheRetentionDays: (days: number) =>
    ipcRenderer.invoke('update-cache:set-retention-days', days) as Promise<{ success: boolean; days?: number; error?: string }>,

  // Updater custom dialog (replaces native system dialog) [更新器自定义对话框 (替换系统原生 dialog)]
  onUpdateDialogShow: (callback: (payload: DialogPayload) => void) => {
    const subscription = (_event: IpcRendererEvent, payload: DialogPayload) => callback(payload);
    ipcRenderer.on('updater:dialog-show', subscription);
    return () => ipcRenderer.removeListener('updater:dialog-show', subscription);
  },
  sendUpdateDialogResponse: (dialogId: string, response: { buttonIndex: number;[key: string]: unknown }) =>
    ipcRenderer.invoke('updater:dialog-response', { dialogId, response }) as Promise<{ ok: boolean }>,
};

// ========== Expose project file system API [暴露项目文件系统 API] ==========
const projectApi: ProjectAPI = {
  openFolder: () => ipcRenderer.invoke('project:open-folder') as Promise<ProjectOpenResult>,
  readTree: (dirPath: string) => ipcRenderer.invoke('project:read-tree', dirPath) as Promise<ProjectTreeResult>,
  readFile: (filePath: string) => ipcRenderer.invoke('project:read-file', filePath) as Promise<ProjectFileReadResult>,
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('project:write-file', filePath, content) as Promise<{ success: boolean; error?: string }>,
};

// ========== Expose to renderer process [暴露给渲染进程] ==========
contextBridge.exposeInMainWorld('electronStore', electronStoreApi);
contextBridge.exposeInMainWorld('electronAPI', electronApi);
contextBridge.exposeInMainWorld('notesAPI', notesApi);
contextBridge.exposeInMainWorld('projectAPI', projectApi);

// Export types for renderer global declarations [导出类型供渲染进程全局声明使用]
export type { ElectronStoreAPI, NotesAPI, ElectronAPI, ProjectAPI };
export type { DialogResponse };
