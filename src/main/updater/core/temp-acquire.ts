// Temp directory: acquire [临时目录 - 获取]
//
// Split out [已拆分]：candidate probing → temp-acquire-candidates.ts,
// user fallback → temp-acquire-fallback.ts.

import { getTempPath } from './updater-paths.js';
import type { TempDirResult } from 'sparklet/shared/types/updater';
import type { TempDirDialogs } from './temp-dialogs.js';
import { tryTempCandidates } from './temp-acquire-candidates.js';
import { askTempFallback } from './temp-acquire-fallback.js';

/**
 * Acquire an available temp directory [获取可用的临时目录]
 * Tries each candidate directory in order; if all fail, prompts user to retry or specify manually [按顺序尝试每个候选目录；若全部失败，提示用户重试或手动指定]
 * @param dialogs Optional dialog callbacks (uses renderer custom UI when provided, falls back to system dialog otherwise) [可选弹窗回调 (提供时使用渲染层自定义 UI，否则回退到系统弹窗)]
 * @returns Temp directory acquire result [临时目录获取结果]
 */
export async function acquireTempDir(dialogs?: TempDirDialogs): Promise<TempDirResult> {
  const found = await tryTempCandidates(getTempPath());
  if (found) return found;

  console.error('[TempManager] All candidate directories unavailable');

  // Show error dialog (custom UI if callbacks provided, otherwise system dialog) [显示错误弹窗 (有回调时用自定义 UI，否则用系统弹窗)]
  const choice = await askTempFallback(dialogs);
  if (choice.kind === 'retry') return acquireTempDir(dialogs);
  return choice.result;
}
