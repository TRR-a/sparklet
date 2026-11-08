// Config store: item-level accessors [配置存储 - 项级访问器]

import { DEFAULT_CONFIG } from 'sparklet/main/updater/constants/constants.js';
import type { UpdaterConfig } from 'sparklet/shared/types/updater/updater.js';
import { readConfig } from 'sparklet/main/updater/config/config-read.js';
import { writeConfig, type ConfigWriteResult } from 'sparklet/main/updater/config/config-write.js';

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
