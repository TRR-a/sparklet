// IPC channel types and API interfaces [IPC 通道类型与 API 接口]

import type { Note, NoteListResult, NoteGetResult, NoteSaveResult, NoteOperationResult } from './notes';
import type { UpdaterConfig, CacheInfo, ToastData, DialogPayload } from './updater';

/** Electron store API exposed to renderer [暴露给渲染进程的存储 API] */
export interface ElectronStoreAPI {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

/** Notes API exposed to renderer [暴露给渲染进程的笔记 API] */
export interface NotesAPI {
  list(): Promise<NoteListResult>;
  get(id: string): Promise<NoteGetResult>;
  save(note: Note): Promise<NoteSaveResult>;
  delete(id: string): Promise<NoteOperationResult>;
  restore(id: string): Promise<NoteOperationResult>;
  permanentDelete(id: string): Promise<NoteOperationResult>;
}

/** Electron API exposed to renderer [暴露给渲染进程的 Electron API] */
export interface ElectronAPI {
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  on(channel: string, callback: (...args: unknown[]) => void): () => void;

  // Updater [更新模块]
  checkUpdate(): Promise<{ started: boolean }>;
  getUpdateStatus(): Promise<{ isUpdating: boolean }>;

  // Updater config [更新配置]
  getUpdaterConfig(): Promise<UpdaterConfig>;
  setUpdaterConfig(config: UpdaterConfig): Promise<{ success: boolean; error?: string }>;
  getUpdaterConfigItem(key: string): Promise<unknown>;
  setUpdaterConfigItem(key: string, value: unknown): Promise<{ success: boolean; error?: string }>;
  exportUpdaterConfig(): Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>;
  importUpdaterConfig(): Promise<{ success: boolean; canceled?: boolean; config?: UpdaterConfig; error?: string }>;
  checkUpdateNow(): Promise<{ started: boolean }>;
  getUpdaterStatus(): Promise<{ isUpdating: boolean; isChecking: boolean; updateDisabled: boolean }>;
  onUpdaterStatusChange(callback: (data: { checking?: boolean; done?: boolean; error?: string }) => void): void;
  onUpdaterProgress(callback: (data: { msg?: string; percent?: number }) => void): void;

  // Toast events [Toast 事件]
  onToastShow(callback: (data: ToastData) => void): void;

  // Dev environment, config changes, official site [开发环境检测、配置变化、官网]
  isDev(): Promise<boolean>;
  onConfigChanged(callback: (config: UpdaterConfig) => void): void;
  openOfficialSite(): Promise<{ success: boolean; error?: string }>;

  // App version [应用版本]
  getAppVersion(): Promise<string>;

  // Update cache management [更新包缓存管理]
  getUpdateCacheInfo(): Promise<{ success: boolean; info?: CacheInfo; error?: string }>;
  clearUpdateCache(): Promise<{ success: boolean; error?: string }>;
  getCacheRetentionDays(): Promise<{ success: boolean; days?: number; error?: string }>;
  setCacheRetentionDays(days: number): Promise<{ success: boolean; days?: number; error?: string }>;

  // Updater custom dialog [更新器自定义弹窗]
  onUpdateDialogShow(callback: (payload: DialogPayload) => void): () => void;
  sendUpdateDialogResponse(dialogId: string, response: { buttonIndex: number;[key: string]: unknown }): Promise<{ ok: boolean }>;
}
