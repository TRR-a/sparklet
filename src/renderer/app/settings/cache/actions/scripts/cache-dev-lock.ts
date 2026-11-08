// Settings: cache section dev-environment lock [设置 - 缓存区开发环境锁定]
//
// Split out [已拆分]：control toggling → cache-dev-lock-controls.ts.

import { getIsDevEnvironment } from 'sparklet/renderer/app/settings/updater/scripts/updater-config.js';
import { lockCacheControls, unlockCacheControls } from 'sparklet/renderer/app/settings/cache/actions/scripts/cache-dev-lock-controls.js';

/**
 * Apply dev environment lock to cache section [应用开发环境锁定到缓存区域]
 */
export function applyCacheDevLock(): void {
  const section = document.getElementById('updateCacheSection');
  if (!section) return;

  if (getIsDevEnvironment()) {
    lockCacheControls();
  } else {
    unlockCacheControls();
  }
}
