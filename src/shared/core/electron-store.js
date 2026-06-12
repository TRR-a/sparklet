// electron-store.js - Electron 存储适配器
// 说明：替代 chrome.storage.local，提供安全的本地数据存储功能

const Store = require('electron-store');

// 初始化 electron-store 实例
// 数据默认保存在用户应用数据目录下，如 %APPDATA%\sparklet\config.json
const store = new Store({
  name: 'sparklet-notes-data',
  defaults: {
    sparkletNotes: []
  }
});

// Electron 存储适配器，模拟 chrome.storage.local API
const electronStoreAdapter = {
  // 获取存储数据（模拟 chrome.storage.local.get）
  async get(keys = null) {
    const allData = store.store; // 获取所有存储的数据
    if (keys === null) {
      return allData;
    }
    // 处理单个 key 或 key 数组
    const keyList = Array.isArray(keys) ? keys : [keys];
    const result = {};
    keyList.forEach(key => {
      // 为笔记数据提供默认值
      if (key === 'sparkletNotes') {
        result[key] = store.get(key, []); // 默认空数组
      } else {
        result[key] = allData[key];
      }
    });
    return result;
  },

  // 设置存储数据（模拟 chrome.storage.local.set）
  async set(items) {
    Object.keys(items).forEach(key => {
      store.set(key, items[key]);
    });
  },

  // 清空所有存储数据（调试用）
  async clear() {
    store.clear();
  }
};

// 导出适配器
module.exports = electronStoreAdapter;