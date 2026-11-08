// Update flow: check stage evaluation [更新流程 - 检查阶段判定]
//
// Split out [已拆分]：lastCheckTime bookkeeping stays in the orchestrator
// to preserve the original exit order.

import type { ProgressCallback, CompleteCallback } from '../../dialog/dialog.js';
import { runCheckStage } from '../update-flow-check.js';
import { runNotifyOnlyBranch } from '../update-flow-notify.js';
import { reportDecision } from '../update-flow-report.js';

/** Outcome of the check stage [检查阶段的走向] */
export type CheckPhase =
  | { kind: 'stop' }
  | { kind: 'up-to-date' }
  | { kind: 'notify-only' }
  | { kind: 'continue'; currentVersion: string; latestVersion: string; zipUrl: string | null; manifestUrl: string | null };

/**
 * Run the check stage and decide where the flow goes [执行检查阶段并决定后续走向]
 * @param behavior Update behavior from preflight (notify-only short-circuits) [预检得到的行为 (notify-only 会短路)]
 */
export async function runCheckPhase(
  onProgress: ProgressCallback | null,
  onComplete: CompleteCallback | null,
  behavior: string
): Promise<CheckPhase> {
  const checkStage = await runCheckStage(onProgress);
  if (checkStage.kind === 'error') {
    reportDecision(
      { kind: 'error', error: checkStage.error, errorType: checkStage.errorType, stage: 'check', friendly: true },
      onComplete
    );
    return { kind: 'stop' };
  }
  if (checkStage.kind === 'up-to-date') {
    onComplete && onComplete(true, null);
    return { kind: 'up-to-date' };
  }

  const { currentVersion, latestVersion, zipUrl, manifestUrl } = checkStage.check;

  if (behavior === 'notify-only') {
    await runNotifyOnlyBranch(currentVersion, latestVersion!, manifestUrl);
    onComplete && onComplete(true, null);
    return { kind: 'notify-only' };
  }

  return { kind: 'continue', currentVersion, latestVersion: latestVersion!, zipUrl, manifestUrl };
}
