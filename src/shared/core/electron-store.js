// src/shared/core/electron-store.js
// 替代 chrome.storage.local 的 Electron 存储适配器
const Store = require('electron-store');

// 初始化 electron-store
// 它默认会将数据保存在用户的应用数据目录下 (例如 %APPDATA%\sparklet-desktop\config.json)
const store = new Store({
  name: 'sparklet-data', // 配置文件名
  defaults: {
    sparkletNotes: [] // 默认数据，空笔记数组
  }
});

const electronStoreAdapter = {
  // 模拟 chrome.storage.local.get
  async get(keys = null) {
    const allData = store.store; // 获取所有存储的数据
    if (keys === null) {
      return allData;
    }
    // 如果 keys 是字符串，转为数组；如果是数组，保持原样
    const keyList = Array.isArray(keys) ? keys : [keys];
    const result = {};
    keyList.forEach(key => {
      // 如果请求的 key 存在，则返回其值，否则返回空对象或空数组（根据你的数据结构调整）
      if (key === 'sparkletNotes') {
        result[key] = store.get(key, []); // 第二个参数是默认值
      } else {
        result[key] = allData[key];
      }
    });
    return result;
  },

  // 模拟 chrome.storage.local.set
  async set(items) {
    Object.keys(items).forEach(key => {
      store.set(key, items[key]);
    });
  },

  // 模拟 chrome.storage.local.clear (可选，用于调试)
  async clear() {
    store.clear();
  }
};

// 导出适配器
module.exports = electronStoreAdapter;