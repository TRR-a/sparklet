// Updater dialog content: update found / notify / restart - barrel [更新器弹窗内容 - 发现更新/仅提醒/重启确认 - 汇总出口]
//
// Split out [已拆分]：new version → updater-dialog-content-update-confirm.ts,
// notify only → updater-dialog-content-notify-only.ts,
// restart confirm → updater-dialog-content-restart-confirm.ts.

export { buildUpdateConfirm } from './updater-dialog-content-update-confirm.js';
export { buildNotifyOnly } from './updater-dialog-content-notify-only.js';
export { buildRestartConfirm } from './updater-dialog-content-restart-confirm.js';
