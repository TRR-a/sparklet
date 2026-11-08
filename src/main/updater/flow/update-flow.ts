// Update flow - performUpdate core logic [更新流程 - performUpdate 核心逻辑]
// Notify branch → update-flow-notify.ts, prepare stage → update-flow-prepare.ts,
// install stage → update-flow-install.ts, cleanup → update-flow-cleanup.ts.
// [仅提醒分支 → update-flow-notify.ts，准备阶段 → update-flow-prepare.ts，
//  安装阶段 → update-flow-install.ts，清理 → update-flow-cleanup.ts]
//
// Split out [已拆分]：preflight guards → update-flow-guards.ts,
// version check stage → update-flow-check.ts,
// stage-result mapping → update-flow-stage-result.ts,
// decision reporting → update-flow-report.ts,
// stage sequence → update-flow-stages.ts.

import type { ProgressCallback, CompleteCallback } from '../dialog/dialog.js';
import { updaterStateInternal } from '../startup/update-state.js';
import { runUpdateFlowStages } from './stages/update-flow-stages.js';

/**
 * Execute the complete update flow [执行完整的更新流程]
 */
export async function performUpdate(onProgress: ProgressCallback | null, onComplete: CompleteCallback | null): Promise<void> {
  if (updaterStateInternal.isUpdating) {
    console.warn('[Updater] Update already in progress');
    onComplete && onComplete(false, 'Update already in progress');
    return;
  }
  updaterStateInternal.isUpdating = true;
  await runUpdateFlowStages(onProgress, onComplete);
}
