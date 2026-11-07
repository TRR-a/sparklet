// Update-specific dialog prompts - barrel [更新专用弹窗 - 汇总出口]
// new version / notify-only / restart confirmation [新版本/仅提醒/重启确认]
//
// Split out [已拆分]：date formatting → dialog-format-date.ts,
// update-confirm → dialog-prompt-update.ts, notify-only → dialog-prompt-notify.ts,
// restart-confirm → dialog-prompt-restart.ts.

export { formatDate } from './dialog-format-date.js';
export { showUpdateDialog } from './dialog-prompt-update.js';
export { showNotifyOnlyDialog } from './dialog-prompt-notify.js';
export { showRestartDialog } from './dialog-prompt-restart.js';
