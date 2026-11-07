// Configuration manager entry - re-exports config API [配置管理器入口 - re-export 配置 API]
// Directory resolution in config-paths.ts [目录解析在 config-paths.ts]
// Read/write store in config-store.ts [读写存储在 config-store.ts]
// File watcher in config-watcher.ts [文件监听在 config-watcher.ts]
// Change broadcast in config-broadcast.ts [变化广播在 config-broadcast.ts]

export { getConfigDir, getConfigFilePath } from './config-paths.js';
export { broadcastConfigChange } from './config-broadcast.js';
export {
  readConfig,
  writeConfig,
  getConfigItem,
  setConfigItem,
  getCheckInterval,
  getUpdateBehavior
} from './config-store.js';
export { startConfigWatcher } from './config-watcher.js';
