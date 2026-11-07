// Cache section: lock/unlock controls [缓存区 - 锁定/解锁控件]
//
// Split out [已拆分]：lock → cache-dev-lock-lock.ts, unlock → cache-dev-lock-unlock.ts.

export { lockCacheControls } from './cache-dev-lock-lock.js';
export { unlockCacheControls } from './cache-dev-lock-unlock.js';
