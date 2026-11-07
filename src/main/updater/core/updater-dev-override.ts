// Updater: development config override [更新器 - 开发环境配置覆盖]

import { app } from 'electron';
import { readConfig, writeConfig, broadcastConfigChange } from './config-manager.js';

/**
 * Force config override in development environment [开发环境强制覆盖配置]
 */
export async function applyDevConfigOverride(): Promise<void> {
  if (app.isPackaged) return;

  console.log('[Updater] Development mode: applying config override');

  const config = await readConfig();
  const changed: string[] = [];

  if (config.updateBehavior !== 'disabled') {
    config.updateBehavior = 'disabled';
    changed.push('updateBehavior');
  }
  if (config.checkInterval !== 1800000) {
    config.checkInterval = 1800000;
    changed.push('checkInterval');
  }

  if (changed.length > 0) {
    await writeConfig(config);
    console.log('[Updater] Dev config override applied:', changed.join(', '));
    broadcastConfigChange(config);
  }
}
