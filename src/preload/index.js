// src/preload/index.js - Electron预加载脚本，安全暴露API给渲染进程
const { contextBridge, ipcRenderer } = require('electron');

// 暴露本地存储API
contextBridge.exposeInMainWorld('electronStore', {
  // 获取存储数据
  get: (key) => ipcRenderer.invoke('store:get', key),
  // 设置存储数据
  set: (key, value) => ipcRenderer.invoke('store:set', key, value),
});

// 暴露通用IPC通信API
contextBridge.exposeInMainWorld('electronAPI', {
  // 异步调用主进程
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  // 监听主进程事件，返回移除监听方法
  on: (channel, callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  
  // ========== 新增：更新模块相关 ==========
  // 手动检查更新
  checkUpdate: () => ipcRenderer.invoke('updater:check'),
  // 获取更新状态
  getUpdateStatus: () => ipcRenderer.invoke('updater:status'),
  // 监听更新对话框事件（由主进程触发）
  onUpdateDialog: (callback) => {
    ipcRenderer.on('updater:show-dialog', (event, data) => callback(data));
  },
  // 用户对更新对话框的响应（'yes' / 'no' / 'restart' / 'later'）
  sendUpdateResponse: (response) => {
    ipcRenderer.send('updater:user-response', response);
  }
});