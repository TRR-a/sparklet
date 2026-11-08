// Update flow: version check stage [更新流程 - 版本检查阶段]

import type { CheckResult } from 'sparklet/shared/types/updater/updater.js';
import { checkForUpdates } from 'sparklet/main/updater/check/check.js';

/** Outcome of the version check stage [版本检查阶段结果] */
export type CheckStageResult =
  | { kind: 'error'; error: string; errorType: string | null }
  | { kind: 'up-to-date' }
  | { kind: 'update'; check: CheckResult };

/** Run the version check and classify the result [执行版本检查并对结果归类] */
export async function runCheckStage(
  onProgress: ((msg: string, percent: number) => void) | null
): Promise<CheckStageResult> {
  onProgress && onProgress('Checking version...', 0);
  const checkResult: CheckResult = await checkForUpdates();
  if (checkResult.error) {
    console.error('[Updater] Version check failed:', checkResult.error);
    return { kind: 'error', error: checkResult.error, errorType: (checkResult.errorType as string | null) ?? null };
  }
  if (!checkResult.hasUpdate) {
    console.log('[Updater] Already up to date');
    return { kind: 'up-to-date' };
  }
  console.log('[Updater] New version found:', checkResult.latestVersion);
  return { kind: 'update', check: checkResult };
}
