// Updater dialog content builders - generates title, body HTML, and buttons for each dialog type [更新器弹窗内容构建器 - 为每种弹窗类型生成标题、内容 HTML 和按钮]
// Types → updater-dialog-types.ts, external open → updater-dialog-external.ts,
// countdown → updater-dialog-countdown.ts, per-case builders grouped by family.
// [类型 → updater-dialog-types.ts，外链 → updater-dialog-external.ts，
//  倒计时 → updater-dialog-countdown.ts，各分支构建按类别分组]

import type { DialogContent } from '../updater-dialog-types.js';
import { buildUpdateConfirm, buildNotifyOnly, buildRestartConfirm } from './updater-dialog-content-update.js';
import { buildRollbackWithCache, buildRollbackRestart, buildRollbackNoCache } from './updater-dialog-content-rollback.js';
import { buildManualUpdateFailed, buildTempDirError, buildTempDirNotEmpty, buildSimpleError } from './updater-dialog-content-error.js';

export { openExternal } from '../updater-dialog-external.js';
export type { DialogButton, DialogContent } from '../updater-dialog-types.js';

/**
 * Build dialog content based on type [根据类型构建弹窗内容]
 * @param dialogType Dialog type [弹窗类型]
 * @param params Params for display (version / errors etc.) [显示参数]
 * @param timeoutMs Timeout in ms (for restart countdown) [超时毫秒 (用于重启倒计时)]
 */
export function buildDialogContent(
  dialogType: string,
  params: Record<string, unknown>,
  timeoutMs: number = 0
): DialogContent {
  switch (dialogType) {
    case 'update-confirm': return buildUpdateConfirm(params);
    case 'notify-only': return buildNotifyOnly(params);
    case 'restart-confirm': return buildRestartConfirm(params, timeoutMs);
    case 'rollback-with-cache': return buildRollbackWithCache(params);
    case 'rollback-restart': return buildRollbackRestart(params);
    case 'rollback-no-cache': return buildRollbackNoCache(params);
    case 'manual-update-failed': return buildManualUpdateFailed(params);
    case 'temp-dir-error': return buildTempDirError();
    case 'temp-dir-not-empty': return buildTempDirNotEmpty();
    case 'simple-error':
    default: return buildSimpleError(params);
  }
}
