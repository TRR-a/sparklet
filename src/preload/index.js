// src/preload/index.js - 安全地暴露存储API给渲染进程
const { contextBridge, ipcRenderer } = require('electron');

// 暴露一个名为 `electronStore` 的安全API给渲染进程的window对象
contextBridge.exposeInMainWorld('electronStore', {
  // 对应 electron-store 的 get 方法
  get: (key) => ipcRenderer.invoke('store:get', key),
  // 对应 electron-store 的 set 方法
  set: (key, value) => ipcRenderer.invoke('store:set', key, value),
});

// 暴露通用 IPC 调用和事件监听
contextBridge.exposeInMainWorld('electronAPI', {
    // 用于向主进程发送请求并等待响应
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    // 用于监听主进程发送的事件（例如设置窗口关闭通知）
    on: (channel, callback) => {
        // 包装回调函数，使其只接收有用的参数（忽略原始的 event 对象）
        const subscription = (event, ...args) => callback(...args);
        ipcRenderer.on(channel, subscription);
        // 返回一个取消监听的函数，便于清理
        return () => ipcRenderer.removeListener(channel, subscription);
    }
});