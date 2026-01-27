// src/preload/index.js - 安全地暴露存储API给渲染进程
const { contextBridge, ipcRenderer } = require('electron');

// 暴露一个名为 `electronStore` 的安全API给渲染进程的window对象
contextBridge.exposeInMainWorld('electronStore', {
  // 对应 electron-store 的 get 方法
  get: (key) => ipcRenderer.invoke('store:get', key),
  // 对应 electron-store 的 set 方法
  set: (key, value) => ipcRenderer.invoke('store:set', key, value),
});