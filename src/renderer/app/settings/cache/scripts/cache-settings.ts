// Settings: cache management section - entry barrel [设置：缓存管理区域 - 入口]
// Info rendering → cache-info-view.ts, clear action → cache-actions.ts,
// dev lock → cache-dev-lock.ts, event bindings → cache-events.ts.
// [信息渲染 → cache-info-view.ts，清空操作 → cache-actions.ts，
//  开发锁定 → cache-dev-lock.ts，事件绑定 → cache-events.ts]

import {
  loadCacheRetentionDays
} from 'sparklet/renderer/app/settings/cache/retention/scripts/cache-retention.js';

export { loadCacheRetentionDays };
export { renderCacheInfo, loadCacheInfo } from 'sparklet/renderer/app/settings/cache/info/scripts/cache-info-view.js';
export { handleClearCache } from 'sparklet/renderer/app/settings/cache/actions/scripts/cache-actions.js';
export { applyCacheDevLock } from 'sparklet/renderer/app/settings/cache/actions/scripts/cache-dev-lock.js';
export { bindCacheEvents } from 'sparklet/renderer/app/settings/cache/scripts/cache-events.js';
