// Temp directory: user fallback choice [临时目录 - 用户兜底选择]

import type { TempDirResult } from 'sparklet/shared/types/updater/updater.js';
import { askTempDirError, type TempDirDialogs } from './temp-dialogs.js';
import { pickManualDir } from './temp-manual-dir.js';

/** Outcome of the "all candidates failed" prompt [全部候选失败后的提示结果] */
export type TempFallbackChoice =
  | { kind: 'retry' }
  | { kind: 'done'; result: TempDirResult };

/**
 * Ask the user to retry or pick a directory manually [询问用户重试还是手动指定目录]
 * 0=retry, 1=manual, otherwise abort [0=重试, 1=手动, 其他=放弃]
 */
export async function askTempFallback(dialogs?: TempDirDialogs): Promise<TempFallbackChoice> {
  const errorResponse = await askTempDirError(dialogs);

  if (errorResponse === 0) return { kind: 'retry' };
  if (errorResponse === 1) {
    const picked = await pickManualDir(dialogs);
    if (picked === 'reselect') return { kind: 'retry' };
    return { kind: 'done', result: picked };
  }
  return { kind: 'done', result: { success: false, path: null, isManual: false } };
}
