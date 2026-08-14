"use strict";
// Configuration manager: file-based settings storage with fallback directories [配置管理器：基于文件的设置存储，带候选目录回退]
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastConfigChange = broadcastConfigChange;
exports.getConfigDir = getConfigDir;
exports.getConfigFilePath = getConfigFilePath;
exports.readConfig = readConfig;
exports.writeConfig = writeConfig;
exports.startConfigWatcher = startConfigWatcher;
exports.getConfigItem = getConfigItem;
exports.setConfigItem = setConfigItem;
exports.getCheckInterval = getCheckInterval;
exports.getUpdateBehavior = getUpdateBehavior;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
// Import from constants to avoid duplicate definitions causing inconsistency [从 constants 统一引入，避免两处重复定义导致不一致]
const constants_1 = require("./constants");
// Config directory state [配置目录状态]
let configDir = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let configWatcher = null;
let configChangeTimer = null;
let isSelfWrite = false;
/**
 * Broadcast config change to all windows [广播配置变化到所有窗口]
 */
function broadcastConfigChange(config) {
    const windows = electron_1.BrowserWindow.getAllWindows();
    for (const win of windows) {
        if (!win.isDestroyed()) {
            win.webContents.send('config:changed', config);
        }
    }
    console.log('[ConfigManager] Config change broadcast to all windows');
}
/**
 * Get config directory (auto-try three candidates, cache result) [获取配置目录 (自动尝试三个候选，并缓存结果)]
 */
async function getConfigDir() {
    if (configDir) {
        return { success: true, path: configDir, error: null };
    }
    const userData = electron_1.app.getPath('userData');
    for (const dirName of constants_1.CONFIG_DIR_NAMES) {
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
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn('[ConfigManager] Cannot access', fullPath, ':', msg);
        }
    }
    const errorMsg = 'Unable to access any config directory. Please check permissions.';
    console.error('[ConfigManager]', errorMsg);
    return { success: false, path: null, error: errorMsg };
}
/**
 * Get config file path [获取配置文件路径]
 */
async function getConfigFilePath() {
    const result = await getConfigDir();
    if (!result.success)
        return null;
    return path.join(result.path, 'settings.json');
}
/**
 * Read config [读取配置]
 */
async function readConfig() {
    const filePath = await getConfigFilePath();
    if (!filePath)
        return { ...constants_1.DEFAULT_CONFIG };
    try {
        const exists = await fs.pathExists(filePath);
        if (!exists) {
            console.log('[ConfigManager] Config file not found, using defaults');
            return { ...constants_1.DEFAULT_CONFIG };
        }
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        const config = { ...constants_1.DEFAULT_CONFIG, ...data };
        console.log('[ConfigManager] Config loaded:', config);
        return config;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[ConfigManager] Read config failed:', msg);
        return { ...constants_1.DEFAULT_CONFIG };
    }
}
/**
 * Write config [写入配置]
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
    }
    catch (err) {
        isSelfWrite = false;
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[ConfigManager] Write config failed:', msg);
        return { success: false, error: msg };
    }
}
/**
 * Start config file watcher [启动配置文件监听]
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
            await fs.writeJson(filePath, constants_1.DEFAULT_CONFIG, { spaces: 2 });
        }
        configWatcher = fs.watch(filePath, async (eventType) => {
            // Both 'change' and 'rename' trigger (some Windows editors save via temp file → rename, triggering rename) [change 和 rename 都触发 (Windows 下部分编辑器保存用「写临时文件→重命名替换」，触发 rename)]
            if (eventType === 'change' || eventType === 'rename') {
                // Skip changes triggered by self-write (writeConfig already broadcasts directly) [自己写入触发的变化，跳过 (writeConfig 已直接广播)]
                if (isSelfWrite) {
                    isSelfWrite = false;
                    if (configChangeTimer)
                        clearTimeout(configChangeTimer);
                    configChangeTimer = null;
                    return;
                }
                console.log('[ConfigManager] Config file changed externally, reloading...');
                // Real debounce: clear previous timer to avoid multiple broadcasts in short time [真正的防抖：清除上一个 timer，避免短时间内多次广播]
                if (configChangeTimer)
                    clearTimeout(configChangeTimer);
                configChangeTimer = setTimeout(async () => {
                    const config = await readConfig();
                    broadcastConfigChange(config);
                    configChangeTimer = null;
                }, 500);
            }
        });
        console.log('[ConfigManager] Config watcher started for:', filePath);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[ConfigManager] Failed to start watcher:', msg);
    }
}
/**
 * Get a single config item [获取单个配置项]
 */
async function getConfigItem(key) {
    const config = await readConfig();
    return config[key];
}
/**
 * Set a single config item [设置单个配置项]
 */
async function setConfigItem(key, value) {
    const config = await readConfig();
    config[key] = value;
    return writeConfig(config);
}
/**
 * Get check interval [获取检查频率]
 */
async function getCheckInterval() {
    const config = await readConfig();
    return config.checkInterval || constants_1.DEFAULT_CONFIG.checkInterval;
}
/**
 * Get update behavior [获取更新行为]
 */
async function getUpdateBehavior() {
    const config = await readConfig();
    return config.updateBehavior || constants_1.DEFAULT_CONFIG.updateBehavior;
}
//# sourceMappingURL=config-manager.js.map