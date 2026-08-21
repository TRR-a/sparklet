// Configuration manager: file-based settings storage with fallback directories [配置管理器：基于文件的设置存储，带候选目录回退]

import * as fs from 'fs-extra';
import * as path from 'path';
import { app, BrowserWindow } from 'electron';
// Import from constants to avoid duplicate definitions causing inconsistency [从 constants 统一引入，避免两处重复定义导致不一致]
import {
  CONFIG_DIR_NAMES,
  DEFAULT_CONFIG
} from './constants';
import type { UpdaterConfig } from '../../shared/types/updater';

// Config directory state [配置目录状态]
let configDir: string | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let configWatcher: any = null;
let configChangeTimer: NodeJS.Timeout | null = null;
let isSelfWrite = false;

/**
 * Broadcast config change to all windows [广播配置变化到所有窗口]
 */
export function broadcastConfigChange(config: UpdaterConfig): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('config:changed', config);
    }
  }
  console.log('[ConfigManager] Config change broadcast to all windows');
}

/** Config directory result [配置目录结果] */
interface ConfigDirResult {
  success: boolean;
  path: string | null;
  error: string | null;
}

/**
 * Get config directory (auto-try three candidates, cache result) [获取配置目录 (自动尝试三个候选，并缓存结果)]
 */
export async function getConfigDir(): Promise<ConfigDirResult> {
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
export async function getConfigFilePath(): Promise<string | null> {
  const result = await getConfigDir();
  if (!result.success) return null;
  return path.join(result.path!, 'settings.json');
}

/** Config write result [配置写入结果] */
interface ConfigWriteResult {
  success: boolean;
  error: string | null;
}

/**
 * Read config [读取配置]
 */
export async function readConfig(): Promise<UpdaterConfig> {
  const filePath = await getConfigFilePath();
  if (!filePath) return { ...DEFAULT_CONFIG };

  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      console.log('[ConfigManager] Config file not found, using defaults');
      return { ...DEFAULT_CONFIG };
    }
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as Partial<UpdaterConfig>;
    const config = { ...DEFAULT_CONFIG, ...data } as UpdaterConfig;
    console.log('[ConfigManager] Config loaded:', config);
    return config;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ConfigManager] Read config failed:', msg);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Write config [写入配置]
 */
export async function writeConfig(config: UpdaterConfig): Promise<ConfigWriteResult> {
  const filePath = await getConfigFilePath();
  if (!filePath) {
    return { success: false, error: 'Config directory unavailable' };
  }

  try {
    isSelfWrite = true;
    await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf8');
    console.log('[ConfigManager] Config saved:', config);
    broadcastConfigChange(config);
    return { success: true, error: null };
  } catch (err) {
    isSelfWrite = false;
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ConfigManager] Write config failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Start config file watcher [启动配置文件监听]
 */
export async function startConfigWatcher(): Promise<void> {
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
      await fs.writeFile(filePath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
    }

    configWatcher = fs.watch(filePath, async (eventType: string) => {
      // Both 'change' and 'rename' trigger (some Windows editors save via temp file → rename, triggering rename) [change 和 rename 都触发 (Windows 下部分编辑器保存用「写临时文件→重命名替换」，触发 rename)]
      if (eventType === 'change' || eventType === 'rename') {
        // Skip changes triggered by self-write (writeConfig already broadcasts directly) [自己写入触发的变化，跳过 (writeConfig 已直接广播)]
        if (isSelfWrite) {
          isSelfWrite = false;
          if (configChangeTimer) clearTimeout(configChangeTimer);
          configChangeTimer = null;
          return;
        }
        console.log('[ConfigManager] Config file changed externally, reloading...');
        // Real debounce: clear previous timer to avoid multiple broadcasts in short time [真正的防抖：清除上一个 timer，避免短时间内多次广播]
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ConfigManager] Failed to start watcher:', msg);
  }
}

/**
 * Get a single config item [获取单个配置项]
 */
export async function getConfigItem(key: keyof UpdaterConfig): Promise<unknown> {
  const config = await readConfig();
  return config[key];
}

/**
 * Set a single config item [设置单个配置项]
 */
export async function setConfigItem(key: keyof UpdaterConfig, value: unknown): Promise<ConfigWriteResult> {
  const config = await readConfig();
  (config as unknown as Record<string, unknown>)[key] = value;
  return writeConfig(config);
}

/**
 * Get check interval [获取检查频率]
 */
export async function getCheckInterval(): Promise<number> {
  const config = await readConfig();
  return config.checkInterval || DEFAULT_CONFIG.checkInterval;
}

/**
 * Get update behavior [获取更新行为]
 */
export async function getUpdateBehavior(): Promise<UpdaterConfig['updateBehavior']> {
  const config = await readConfig();
  return config.updateBehavior || DEFAULT_CONFIG.updateBehavior;
}
