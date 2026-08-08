// src/main/updater/config-manager.js
// Configuration manager: file-based settings storage with fallback directories

const fs = require('fs-extra');
const path = require('path');
const { app, BrowserWindow } = require('electron');
// 从 constants 统一引入，避免两处重复定义导致不一致
const {
  CONFIG_DIR_NAMES: _DIRS,
  DEFAULT_CONFIG: _BASE_CONFIG
} = require('./constants');

// 三个候选配置文件夹名（按优先级）
const CONFIG_DIR_NAMES = _DIRS;

// 默认配置（以 constants 为基础，补充完整性校验字段）
// 注意：constants 中的 DEFAULT_CONFIG 可能缺字段，这里用 Object.assign 合并确保完整性
const DEFAULT_CONFIG = Object.assign({
  updateBehavior: 'auto',
  checkInterval: 86400000,
  lastCheckTime: null,
  autoDownload: true,
  integrityCheck: true
}, _BASE_CONFIG || {});

let configDir = null;
let configWatcher = null;
let configChangeTimer = null;
let isSelfWrite = false;

/**
 * 广播配置变化到所有窗口
 */
function broadcastConfigChange(config) {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('config:changed', config);
    }
  }
  console.log('[ConfigManager] Config change broadcast to all windows');
}

/**
 * 获取配置目录（自动尝试三个候选，并缓存结果）
 */
async function getConfigDir() {
  if (configDir) {
    return { success: true, path: configDir, error: null };
  }

  const userData = app.getPath('userData');

  for (const dirName of CONFIG_DIR_NAMES) {
    const fullPath = path.join(userData, dirName);
    try {
      const exists = await fs.pathExists(fullPath);
      if (!exists) {
        await fs.ensureDir(fullPath);
        console.log('[ConfigManager] Created config directory:', fullPath);
        configDir = fullPath;
        return { success: true, path: fullPath, error: null };
      }
      await fs.access(fullPath, fs.constants.R_OK | fs.constants.W_OK);
      console.log('[ConfigManager] Using existing config directory:', fullPath);
      configDir = fullPath;
      return { success: true, path: fullPath, error: null };
    } catch (err) {
      console.warn('[ConfigManager] Cannot access', fullPath, ':', err.message);
    }
  }

  const errorMsg = 'Unable to access any config directory. Please check permissions.';
  console.error('[ConfigManager]', errorMsg);
  return { success: false, path: null, error: errorMsg };
}

/**
 * 获取配置文件路径
 */
async function getConfigFilePath() {
  const result = await getConfigDir();
  if (!result.success) return null;
  return path.join(result.path, 'settings.json');
}

/**
 * 读取配置
 */
async function readConfig() {
  const filePath = await getConfigFilePath();
  if (!filePath) return { ...DEFAULT_CONFIG };

  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      console.log('[ConfigManager] Config file not found, using defaults');
      return { ...DEFAULT_CONFIG };
    }
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    const config = { ...DEFAULT_CONFIG, ...data };
    console.log('[ConfigManager] Config loaded:', config);
    return config;
  } catch (err) {
    console.error('[ConfigManager] Read config failed:', err.message);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 写入配置
 */
async function writeConfig(config) {
  const filePath = await getConfigFilePath();
  if (!filePath) {
    return { success: false, error: 'Config directory unavailable' };
  }

  try {
    isSelfWrite = true;
    await fs.writeJson(filePath, config, { spaces: 2 });
    console.log('[ConfigManager] Config saved:', config);
    broadcastConfigChange(config);
    return { success: true, error: null };
  } catch (err) {
    isSelfWrite = false;
    console.error('[ConfigManager] Write config failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 启动配置文件监听
 */
async function startConfigWatcher() {
  if (configWatcher) {
    configWatcher.close();
    configWatcher = null;
  }

  const filePath = await getConfigFilePath();
  if (!filePath) {
    console.warn('[ConfigManager] Cannot start watcher: config path unavailable');
    return;
  }

  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      await fs.writeJson(filePath, DEFAULT_CONFIG, { spaces: 2 });
    }

    configWatcher = fs.watch(filePath, async (eventType) => {
      // change 和 rename 都触发（Windows 下部分编辑器保存用「写临时文件→重命名替换」，触发 rename）
      if (eventType === 'change' || eventType === 'rename') {
        // 自己写入触发的变化，跳过（writeConfig 已直接广播）
        if (isSelfWrite) {
          isSelfWrite = false;
          if (configChangeTimer) clearTimeout(configChangeTimer);
          configChangeTimer = null;
          return;
        }
        console.log('[ConfigManager] Config file changed externally, reloading...');
        // 真正的防抖：清除上一个 timer，避免短时间内多次广播
        if (configChangeTimer) clearTimeout(configChangeTimer);
        configChangeTimer = setTimeout(async () => {
          const config = await readConfig();
          broadcastConfigChange(config);
          configChangeTimer = null;
        }, 500);
      }
    });

    console.log('[ConfigManager] Config watcher started for:', filePath);
  } catch (err) {
    console.error('[ConfigManager] Failed to start watcher:', err.message);
  }
}

/**
 * 获取单个配置项
 */
async function getConfigItem(key) {
  const config = await readConfig();
  return config[key];
}

/**
 * 设置单个配置项
 */
async function setConfigItem(key, value) {
  const config = await readConfig();
  config[key] = value;
  return writeConfig(config);
}

/**
 * 获取检查频率
 */
async function getCheckInterval() {
  const config = await readConfig();
  return config.checkInterval || DEFAULT_CONFIG.checkInterval;
}

/**
 * 获取更新行为
 */
async function getUpdateBehavior() {
  const config = await readConfig();
  return config.updateBehavior || DEFAULT_CONFIG.updateBehavior;
}

module.exports = {
  CONFIG_DIR_NAMES,
  DEFAULT_CONFIG,
  getConfigDir,
  getConfigFilePath,
  readConfig,
  writeConfig,
  getConfigItem,
  setConfigItem,
  getCheckInterval,
  getUpdateBehavior,
  startConfigWatcher,
  broadcastConfigChange
};