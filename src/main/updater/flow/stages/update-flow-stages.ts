// Update flow: stage sequence execution [更新流程 - 阶段序列执行]
//
// Split out [已拆分]：check phase → update-flow-stages-check.ts,
// prepare+install → update-flow-stages-install.ts,
// failure handling → update-flow-stages-error.ts,
// exit helpers → update-flow-stages-exit.ts,
// branch settling → update-flow-stages-branch.ts.

import type { ProgressCallback, CompleteCallback } from '../../dialog/dialog.js';
import { updaterStateInternal } from '../../startup/update-state.js';
import { runUpdatePreflight } from '../update-flow-guards.js';
import { runCheckPhase } from './update-flow-stages-check.js';
import { runInstallPhase } from './update-flow-stages-install.js';
import { handleFlowError } from './update-flow-stages-error.js';
import { stopFlow } from './update-flow-stages-exit.js';
import { settleNonContinuePhase } from './update-flow-stages-branch.js';
import type { FlowArtifacts } from './update-flow-stages-install.js';

/**
 * Run preflight → check → notify/prepare → install, reporting the outcome once
 * [依次执行预检 → 检查 → 提醒/准备 → 安装，并只回报一次结果]
 * Expects [调用方需保证]：`isUpdating` already set and cleared here on every exit
 * [进入前已置 isUpdating，且本函数在每条退出路径上复位]
 */
export async function runUpdateFlowStages(
  onProgress: ProgressCallback | null,
  onComplete: CompleteCallback | null
): Promise<void> {
  const artifacts: FlowArtifacts = { zipPath: null, tempDir: null, isManualDir: false };

  try {
    const preflight = await runUpdatePreflight(onComplete);
    if (!preflight.proceed) {
      stopFlow();
      return;
    }

    const checkPhase = await runCheckPhase(onProgress, onComplete, preflight.behavior);

    const continuePhase = await settleNonContinuePhase(checkPhase);
    if (!continuePhase) return;

    await runInstallPhase(continuePhase, onProgress, onComplete, (assigned) => {
      artifacts.zipPath = assigned.zipPath;
      artifacts.tempDir = assigned.tempDir;
      artifacts.isManualDir = assigned.isManualDir;
    });
    updaterStateInternal.isUpdating = false;
  } catch (err) {
    await handleFlowError(err, artifacts, onComplete, () => {
      updaterStateInternal.isUpdating = false;
    });
  }
}
