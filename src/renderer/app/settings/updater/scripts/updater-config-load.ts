// Settings: load updater config into UI [设置 - 加载更新配置到 UI]
//
// Split out [已拆分]：dev lock UI → updater-config-load-dev.ts,
// production apply → updater-config-load-prod.ts.

import { appApi, updaterApi } from 'sparklet/renderer/shared/index.js';
import { getIsDevEnvironment, setIsDevEnvironment, getUpdaterConfig, setUpdaterConfig } from './updater-config-state.js';
import { applyDevLockUI } from './updater-config-load-dev.js';
import { applyProdConfigUI } from './updater-config-load-prod.js';

/**
 * Load updater config from main process and apply to UI [从主进程加载更新配置并应用到 UI]
 */
export async function loadUpdaterConfig(): Promise<void> {
  try {
    setIsDevEnvironment(await appApi.isDev());
    console.log('[Settings] Is dev environment:', getIsDevEnvironment());

    setUpdaterConfig(await updaterApi.getConfig());
    const updaterConfig = getUpdaterConfig();
    if (!updaterConfig) return;

    if (getIsDevEnvironment()) {
      applyDevLockUI();
    } else {
      applyProdConfigUI(updaterConfig);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('加载更新配置失败:', msg);
  }
}
