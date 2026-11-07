// Config store: write to disk [配置存储 - 写入磁盘]

import * as fs from 'fs-extra';
import type { UpdaterConfig } from 'sparklet/shared/types/updater';
import { getConfigFilePath } from './config-paths.js';
import { broadcastConfigChange } from './config-broadcast.js';
import { markSelfWrite, setCachedConfig } from './config-state.js';

/** Config write result [配置写入结果] */
export interface ConfigWriteResult {
  success: boolean;
  error: string | null;
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
    markSelfWrite(true);
    await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf8');
    setCachedConfig(config);
    console.log('[ConfigManager] Config saved:', config);
    broadcastConfigChange(config);
    return { success: true, error: null };
  } catch (err) {
    markSelfWrite(false);
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ConfigManager] Write config failed:', msg);
    return { success: false, error: msg };
  }
}
