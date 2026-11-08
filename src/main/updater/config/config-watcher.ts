// Config file watcher [配置文件监听]
//
// Split out [已拆分]：external change handling → config-watcher-change.ts.

import * as fs from 'fs-extra';
import { DEFAULT_CONFIG } from 'sparklet/main/updater/constants/constants.js';
import { getConfigFilePath } from 'sparklet/main/updater/config/config-paths.js';
import { handleExternalConfigChange } from 'sparklet/main/updater/config/config-watcher-change.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let configWatcher: any = null;

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

    configWatcher = fs.watch(filePath, (eventType: string) => {
      handleExternalConfigChange(eventType);
    });

    console.log('[ConfigManager] Config watcher started for:', filePath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ConfigManager] Failed to start watcher:', msg);
  }
}
