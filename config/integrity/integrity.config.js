// config/integrity/integrity.config.js
// 文件完整性校验模块全局配置与策略管理
const Store = require('electron-store');

// 全局常量
const CURRENT_VERSION = "v0.2.2";
const INTEGRITY_MANIFEST_URL = "https://raw.githubusercontent.com/TRR-a/sparklet/main/integrity-manifest.json";

// 校验策略枚举（与更新策略完全一致）
const INTEGRITY_STRATEGY = {
  IMMEDIATE: "immediate",
  DELAY_30MIN: "delay_30min",
  DELAY_1H: "delay_1h",
  DELAY_2H: "delay_2h",
  DELAY_1D: "delay_1d",
  ON_RESTART: "on_restart",
  NEVER: "never"
};

// 策略对应延迟时间（毫秒）
const INTEGRITY_DELAYS = {
  [INTEGRITY_STRATEGY.DELAY_30MIN]: 30 * 60 * 1000,
  [INTEGRITY_STRATEGY.DELAY_1H]: 60 * 60 * 1000,
  [INTEGRITY_STRATEGY.DELAY_2H]: 2 * 60 * 60 * 1000,
  [INTEGRITY_STRATEGY.DELAY_1D]: 24 * 60 * 60 * 1000
};

// 默认校验配置
const DEFAULT_INTEGRITY_CONFIG = {
  autoCheckEnabled: true,
  checkInterval: 60 * 60 * 1000, // 每1小时自动校验
  currentStrategy: INTEGRITY_STRATEGY.ON_RESTART,
  lastCheckTime: 0,
  nextRemindTime: 0
};

// 初始化存储实例
const store = new Store({
  name: 'sparklet-data'
});

// 配置管理方法
const integrityConfig = {
  // 获取完整校验配置
  get() {
    return store.get('integrityConfig', DEFAULT_INTEGRITY_CONFIG);
  },

  // 保存校验配置
  set(config) {
    store.set('integrityConfig', { ...this.get(), ...config });
  },

  // 重置为默认配置
  reset() {
    store.set('integrityConfig', DEFAULT_INTEGRITY_CONFIG);
  }
};

module.exports = {
  CURRENT_VERSION,
  INTEGRITY_MANIFEST_URL,
  INTEGRITY_STRATEGY,
  INTEGRITY_DELAYS,
  DEFAULT_INTEGRITY_CONFIG,
  integrityConfig
};