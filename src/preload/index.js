// src/preload/index.js - Electron预加载脚本，安全暴露API给渲染进程
const { contextBridge, ipcRenderer } = require('electron');

// 暴露本地存储API
contextBridge.exposeInMainWorld('electronStore', {
  get: (key) => ipcRenderer.invoke('store:get', key),
  set: (key, value) => ipcRenderer.invoke('store:set', key, value),
});

// 暴露通用IPC通信API
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  // 更新模块（注意：onUpdateDialog / sendUpdateResponse 是旧版自定义对话框遗留，已删除，使用原生 dialog）
  checkUpdate: () => ipcRenderer.invoke('updater:check'),
  getUpdateStatus: () => ipcRenderer.invoke('updater:status'),

  // 更新配置
  getUpdaterConfig: () => ipcRenderer.invoke('updater-config:read'),
  setUpdaterConfig: (config) => ipcRenderer.invoke('updater-config:write', config),
  getUpdaterConfigItem: (key) => ipcRenderer.invoke('updater-config:get', key),
  setUpdaterConfigItem: (key, value) => ipcRenderer.invoke('updater-config:set', key, value),
  exportUpdaterConfig: () => ipcRenderer.invoke('updater-config:export-file'),
  importUpdaterConfig: () => ipcRenderer.invoke('updater-config:import-file'),
  checkUpdateNow: () => ipcRenderer.invoke('updater:check-now'),
  getUpdaterStatus: () => ipcRenderer.invoke('updater:get-status'),
  onUpdaterStatusChange: (callback) => {
    ipcRenderer.on('updater:status-change', (event, data) => callback(data));
  },
  onUpdaterProgress: (callback) => {
    ipcRenderer.on('updater:progress', (event, data) => callback(data));
  },

  // Toast 事件
  onToastShow: (callback) => {
    ipcRenderer.on('toast:show', (event, data) => callback(data));
  },

  // ========== 新增：开发环境检测、配置变化监听、打开官网 ==========
  isDev: () => ipcRenderer.invoke('updater:is-dev'),
  onConfigChanged: (callback) => {
    ipcRenderer.on('config:changed', (event, config) => callback(config));
  },
  openOfficialSite: () => ipcRenderer.invoke('app:open-official-site'),

  // ========== 获取应用版本 ==========
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),

  // ========== 更新包缓存管理（设置页用）==========
  getUpdateCacheInfo: () => ipcRenderer.invoke('update-cache:get-info'),
  clearUpdateCache: () => ipcRenderer.invoke('update-cache:clear-all'),
  getCacheRetentionDays: () => ipcRenderer.invoke('update-cache:get-retention-days'),
  setCacheRetentionDays: (days) => ipcRenderer.invoke('update-cache:set-retention-days', days),

  // ========== 更新器自定义对话框（替换系统原生 dialog.showMessageBox）==========
  // 主进程发起 -> 渲染层弹 UI -> 用户操作 -> 渲染层回传结果
  onUpdateDialogShow: (callback) => {
    const subscription = (event, payload) => callback(payload);
    ipcRenderer.on('updater:dialog-show', subscription);
    return () => ipcRenderer.removeListener('updater:dialog-show', subscription);
  },
  sendUpdateDialogResponse: (dialogId, response) =>
    ipcRenderer.invoke('updater:dialog-response', { dialogId, response })
});