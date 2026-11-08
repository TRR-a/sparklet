// Settings: cache management section - entry barrel [设置：缓存管理区域 - 入口]
// Info rendering → cache-info-view.ts, clear action → cache-actions.ts,
// dev lock → cache-dev-lock.ts, event bindings → cache-events.ts.
// [信息渲染 → cache-info-view.ts，清空操作 → cache-actions.ts，
//  开发锁定 → cache-dev-lock.ts，事件绑定 → cache-events.ts]

import {
  loadCacheRetentionDays
} from '../retention/scripts/cache-retention.js';

export { loadCacheRetentionDays };
export { renderCacheInfo, loadCacheInfo } from '../info/scripts/cache-info-view.js';
export { handleClearCache } from '../actions/scripts/cache-actions.js';
export { applyCacheDevLock } from '../actions/scripts/cache-dev-lock.js';
export { bindCacheEvents } from './cache-events.js';
