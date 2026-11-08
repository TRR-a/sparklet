// Cache retention: load and apply [缓存保留天数 - 读取并应用]

import { updaterApi } from 'sparklet/renderer/shared/index.js';
import { RETENTION_DEFAULT } from 'sparklet/renderer/app/settings/cache/retention/scripts/cache-retention-constants.js';
import { applyRetentionUI } from 'sparklet/renderer/app/settings/cache/retention/scripts/cache-retention-ui.js';

/**
 * Load cache retention days from main process and apply to UI [从主进程读取当前配置并应用到 UI]
 */
export async function loadCacheRetentionDays(): Promise<void> {
  if (!window.sparklet) return;
  try {
    const result = await updaterApi.getCacheRetentionDays();
    const days = result && Number.isFinite(result.days) ? result.days! : RETENTION_DEFAULT;
    applyRetentionUI(days, false);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('加载保留天数配置失败:', msg);
    applyRetentionUI(RETENTION_DEFAULT, false);
  }
}
