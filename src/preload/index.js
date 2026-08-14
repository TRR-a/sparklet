"use strict";
// Preload script - securely exposes APIs to renderer process [预加载脚本 - 安全暴露 API 给渲染进程]
// Compiled with CommonJS (main process config) [使用 CommonJS 编译 (主进程配置)]
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// ========== Expose local storage API (config class, notes already migrated to file system) [暴露本地存储 API (配置类，笔记类已迁移至文件系统)] ==========
const electronStoreApi = {
    get: (key) => electron_1.ipcRenderer.invoke('store:get', key),
    set: (key, value) => electron_1.ipcRenderer.invoke('store:set', key, value),
};
// ========== Expose notes file system API [暴露笔记文件系统 API] ==========
const notesApi = {
    list: () => electron_1.ipcRenderer.invoke('notes:list'),
    get: (id) => electron_1.ipcRenderer.invoke('notes:get', id),
    save: (note) => electron_1.ipcRenderer.invoke('notes:save', note),
    delete: (id) => electron_1.ipcRenderer.invoke('notes:delete', id),
    restore: (id) => electron_1.ipcRenderer.invoke('notes:restore', id),
    permanentDelete: (id) => electron_1.ipcRenderer.invoke('notes:permanentDelete', id),
};
// ========== Expose general IPC communication API [暴露通用 IPC 通信 API] ==========
const electronApi = {
    invoke: (channel, ...args) => electron_1.ipcRenderer.invoke(channel, ...args),
    on: (channel, callback) => {
        const subscription = (_event, ...args) => callback(...args);
        electron_1.ipcRenderer.on(channel, subscription);
        return () => electron_1.ipcRenderer.removeListener(channel, subscription);
    },
    // Updater [更新模块]
    checkUpdate: () => electron_1.ipcRenderer.invoke('updater:check'),
    getUpdateStatus: () => electron_1.ipcRenderer.invoke('updater:status'),
    // Updater config [更新配置]
    getUpdaterConfig: () => electron_1.ipcRenderer.invoke('updater-config:read'),
    setUpdaterConfig: (config) => electron_1.ipcRenderer.invoke('updater-config:write', config),
    getUpdaterConfigItem: (key) => electron_1.ipcRenderer.invoke('updater-config:get', key),
    setUpdaterConfigItem: (key, value) => electron_1.ipcRenderer.invoke('updater-config:set', key, value),
    exportUpdaterConfig: () => electron_1.ipcRenderer.invoke('updater-config:export-file'),
    importUpdaterConfig: () => electron_1.ipcRenderer.invoke('updater-config:import-file'),
    checkUpdateNow: () => electron_1.ipcRenderer.invoke('updater:check-now'),
    getUpdaterStatus: () => electron_1.ipcRenderer.invoke('updater:get-status'),
    onUpdaterStatusChange: (callback) => {
        electron_1.ipcRenderer.on('updater:status-change', (_event, data) => callback(data));
    },
    onUpdaterProgress: (callback) => {
        electron_1.ipcRenderer.on('updater:progress', (_event, data) => callback(data));
    },
    // Toast events [Toast 事件]
    onToastShow: (callback) => {
        electron_1.ipcRenderer.on('toast:show', (_event, data) => callback(data));
    },
    // Dev environment, config changes, official site [开发环境检测、配置变化、官网]
    isDev: () => electron_1.ipcRenderer.invoke('updater:is-dev'),
    onConfigChanged: (callback) => {
        electron_1.ipcRenderer.on('config:changed', (_event, config) => callback(config));
    },
    openOfficialSite: () => electron_1.ipcRenderer.invoke('app:open-official-site'),
    // App version [应用版本]
    getAppVersion: () => electron_1.ipcRenderer.invoke('app:get-version'),
    // Update cache management (for settings page) [更新包缓存管理 (设置页用)]
    getUpdateCacheInfo: () => electron_1.ipcRenderer.invoke('update-cache:get-info'),
    clearUpdateCache: () => electron_1.ipcRenderer.invoke('update-cache:clear-all'),
    getCacheRetentionDays: () => electron_1.ipcRenderer.invoke('update-cache:get-retention-days'),
    setCacheRetentionDays: (days) => electron_1.ipcRenderer.invoke('update-cache:set-retention-days', days),
    // Updater custom dialog (replaces native system dialog) [更新器自定义对话框 (替换系统原生 dialog)]
    onUpdateDialogShow: (callback) => {
        const subscription = (_event, payload) => callback(payload);
        electron_1.ipcRenderer.on('updater:dialog-show', subscription);
        return () => electron_1.ipcRenderer.removeListener('updater:dialog-show', subscription);
    },
    sendUpdateDialogResponse: (dialogId, response) => electron_1.ipcRenderer.invoke('updater:dialog-response', { dialogId, response }),
};
// ========== Expose to renderer process [暴露给渲染进程] ==========
electron_1.contextBridge.exposeInMainWorld('electronStore', electronStoreApi);
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronApi);
electron_1.contextBridge.exposeInMainWorld('notesAPI', notesApi);
//# sourceMappingURL=index.js.map