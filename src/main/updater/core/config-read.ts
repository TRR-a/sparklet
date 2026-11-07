// Config store: read from disk [配置存储 - 从磁盘读取]

import * as fs from 'fs-extra';
import { DEFAULT_CONFIG } from './constants.js';
import type { UpdaterConfig } from 'sparklet/shared/types/updater';
import { getConfigFilePath } from './config-paths.js';
import { getCachedConfig, setCachedConfig } from './config-state.js';

/**
 * Read config [读取配置]
 */
export async function readConfig(): Promise<UpdaterConfig> {
  // Return cached config to avoid repeated file reads and log spam [返回缓存配置，避免重复读文件和刷屏日志]
  const cached = getCachedConfig();
  if (cached) return cached;

  const filePath = await getConfigFilePath();
  if (!filePath) {
    setCachedConfig({ ...DEFAULT_CONFIG });
    return getCachedConfig()!;
  }

  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      console.log('[ConfigManager] Config file not found, using defaults');
      setCachedConfig({ ...DEFAULT_CONFIG });
      return getCachedConfig()!;
    }
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as Partial<UpdaterConfig>;
    setCachedConfig({ ...DEFAULT_CONFIG, ...data } as UpdaterConfig);
    console.log('[ConfigManager] Config loaded:', getCachedConfig());
    return getCachedConfig()!;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ConfigManager] Read config failed:', msg);
    setCachedConfig({ ...DEFAULT_CONFIG });
    return getCachedConfig()!;
  }
}
