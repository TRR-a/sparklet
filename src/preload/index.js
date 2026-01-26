// src/preload/index.js - 预加载脚本（安全通信桥梁）
// 这里稍后将暴露安全的API给渲染进程（你的前端代码）
const { contextBridge } = require('electron');

// 目前我们先留空，确保应用能启动
console.log('预加载脚本已注入');