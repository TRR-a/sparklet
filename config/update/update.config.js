// config/update/update.config.js
// 更新模块全局配置与策略管理
const Store = require('electron-store');

// 全局常量
const CURRENT_VERSION = "v0.2.2";
const INTERNAL_CODENAME = "Vapor";
const GITHUB_RELEASES_URL = "https://api.github.com/repos/TRR-a/sparklet/releases/latest";
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/TRR-a/sparklet/main/";

// 更新策略枚举（与弹窗选项一一对应）
const UPDATE_STRATEGY = {
  IMMEDIATE: "immediate",
  DELAY_30MIN: "delay_30min",
  DELAY_1H: "delay_1h",
  DELAY_2H: "delay_2h",
  DELAY_1D: "delay_1d",
  ON_RESTART: "on_restart",
  NEVER: "never"
};

// 策略对应延迟时间（毫秒）
const UPDATE_DELAYS = {
  [UPDATE_STRATEGY.DELAY_30MIN]: 30 * 60 * 1000,
  [UPDATE_STRATEGY.DELAY_1H]: 60 * 60 * 1000,
  [UPDATE_STRATEGY.DELAY_2H]: 2 * 60 * 60 * 1000,
  [UPDATE_STRATEGY.DELAY_1D]: 24 * 60 * 60 * 1000
};

// 默认更新配置
const DEFAULT_UPDATE_CONFIG = {
  autoCheckEnabled: true,
  checkInterval: 60 * 60 * 1000, // 每1小时自动检测
  currentStrategy: UPDATE_STRATEGY.ON_RESTART,
  lastCheckTime: 0,
  nextRemindTime: 0,
  ignoredVersion: null
};

// 初始化存储实例（与主进程共用同一个存储文件）
const store = new Store({
  name: 'sparklet-data'
});

// 配置管理方法
const updateConfig = {
  // 获取完整更新配置
  get() {
    return store.get('updateConfig', DEFAULT_UPDATE_CONFIG);
  },

  // 保存更新配置
  set(config) {
    store.set('updateConfig', { ...this.get(), ...config });
  },

  // 重置为默认配置
  reset() {
    store.set('updateConfig', DEFAULT_UPDATE_CONFIG);
  }
};

module.exports = {
  CURRENT_VERSION,
  INTERNAL_CODENAME,
  GITHUB_RELEASES_URL,
  GITHUB_RAW_URL,
  UPDATE_STRATEGY,
  UPDATE_DELAYS,
  DEFAULT_UPDATE_CONFIG,
  updateConfig
};