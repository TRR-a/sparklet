// Settings: load cache info from main process [设置 - 从主进程加载缓存信息]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast/toast.js';
import { updaterApi } from 'sparklet/renderer/shared/index.js';
import { renderCacheInfo } from './cache-info-view-render.js';

/**
 * Load cache info from main process [从主进程加载缓存信息]
 */
export async function loadCacheInfo(): Promise<void> {
  try {
    const result = await updaterApi.getCacheInfo();
    if (result && result.success && result.info) {
      renderCacheInfo(result.info);
    } else {
      renderCacheInfo(null);
      if (result && result.error) {
        showToast(t('settings.toast.cacheReadFailed') + result.error);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('加载缓存信息失败:', msg);
    renderCacheInfo(null);
  }
}
