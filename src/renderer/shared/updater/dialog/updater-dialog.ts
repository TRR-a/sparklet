// Updater custom dialog - barrel [更新器自定义弹窗 - 汇总出口]
// Replaces native system dialog for update notifications [替换系统原生弹窗用于更新通知]
//
// Split out [已拆分]：params type → updater-dialog-types.ts,
// response sender → updater-dialog-response.ts, button row → updater-dialog-buttons.ts,
// show/render → updater-dialog-show.ts, IPC listener → updater-dialog-listener.ts.

export type { UpdaterDialogParams } from './updater-dialog-types.js';
export { showUpdaterDialog } from './updater-dialog-show.js';
export { bindUpdaterDialogListener } from './updater-dialog-listener.js';
