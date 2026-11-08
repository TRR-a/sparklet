// Updater dialog content: failures and temp-dir prompts - barrel [更新器弹窗内容 - 失败与临时目录提示 - 汇总出口]
//
// Split out [已拆分]：manual failed → updater-dialog-content-manual-failed.ts,
// temp-dir prompts → updater-dialog-content-temp-dir.ts,
// generic simple error → updater-dialog-content-generic-error.ts.

export { buildManualUpdateFailed } from 'sparklet/renderer/shared/updater/dialog/content/updater-dialog-content-manual-failed.js';
export { buildTempDirError, buildTempDirNotEmpty } from 'sparklet/renderer/shared/updater/dialog/content/updater-dialog-content-temp-dir.js';
export { buildSimpleError } from 'sparklet/renderer/shared/updater/dialog/content/updater-dialog-content-generic-error.js';
