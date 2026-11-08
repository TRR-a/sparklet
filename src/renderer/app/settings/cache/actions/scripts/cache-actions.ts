// Settings: clear cache action [设置 - 清空缓存操作]
//
// Split out [已拆分]：cache presence check → cache-actions-check.ts,
// clear execution → cache-actions-clear.ts.

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast/toast.js';
import { getIsDevEnvironment } from '../../../updater/scripts/updater-config.js';
import { hasAnyCache } from './cache-actions-check.js';
import { runClearCache } from './cache-actions-clear.js';

/**
 * Handle clear cache button click [处理清空缓存按钮点击]
 */
export async function handleClearCache(): Promise<void> {
  if (getIsDevEnvironment()) {
    showToast(t('settings.devLock.cacheLocked'), 'info', 3000);
    return;
  }

  if (!(await hasAnyCache())) {
    showToast(t('settings.toast.cacheEmpty'), 'info', 2500);
    return;
  }

  await runClearCache();
}
