// Update flow: stage sequence execution [更新流程 - 阶段序列执行]
//
// Split out [已拆分]：check phase → update-flow-stages-check.ts,
// prepare+install → update-flow-stages-install.ts,
// failure handling → update-flow-stages-error.ts,
// exit helpers → update-flow-stages-exit.ts,
// branch settling → update-flow-stages-branch.ts.

import type { ProgressCallback, CompleteCallback } from 'sparklet/main/updater/dialog/dialog.js';
import { updaterStateInternal } from 'sparklet/main/updater/startup/update-state.js';
import { runUpdatePreflight } from 'sparklet/main/updater/flow/update-flow-guards.js';
import { runCheckPhase } from 'sparklet/main/updater/flow/stages/update-flow-stages-check.js';
import { runInstallPhase } from 'sparklet/main/updater/flow/stages/update-flow-stages-install.js';
import { handleFlowError } from 'sparklet/main/updater/flow/stages/update-flow-stages-error.js';
import { stopFlow } from 'sparklet/main/updater/flow/stages/update-flow-stages-exit.js';
import { settleNonContinuePhase } from 'sparklet/main/updater/flow/stages/update-flow-stages-branch.js';
import type { FlowArtifacts } from 'sparklet/main/updater/flow/stages/update-flow-stages-install.js';

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
