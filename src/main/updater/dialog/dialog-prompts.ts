// Update-specific dialog prompts - barrel [更新专用弹窗 - 汇总出口]
// new version / notify-only / restart confirmation [新版本/仅提醒/重启确认]
//
// Split out [已拆分]：date formatting → dialog-format-date.ts,
// update-confirm → dialog-prompt-update.ts, notify-only → dialog-prompt-notify.ts,
// restart-confirm → dialog-prompt-restart.ts.

export { formatDate } from 'sparklet/main/updater/dialog/dialog-format-date.js';
export { showUpdateDialog } from 'sparklet/main/updater/dialog/dialog-prompt-update.js';
export { showNotifyOnlyDialog } from 'sparklet/main/updater/dialog/dialog-prompt-notify.js';
export { showRestartDialog } from 'sparklet/main/updater/dialog/dialog-prompt-restart.js';
