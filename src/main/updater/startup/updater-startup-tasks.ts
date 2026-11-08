// Updater: startup background tasks - barrel [更新器 - 启动时后台任务 - 汇总出口]
//
// Split out [已拆分]：cache cleanup → updater-startup-cache-cleanup.ts,
// installed-file check → updater-startup-file-check.ts,
// executable self-check → updater-startup-self-check.ts.

export { scheduleStartupCacheCleanup } from './updater-startup-cache-cleanup.js';
export { scheduleStartupFileIntegrityCheck } from './updater-startup-file-check.js';
export { runStartupSelfCheck } from './updater-startup-self-check.js';
