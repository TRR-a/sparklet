// Update check: failed-fetch result [更新检查 - 拉取失败结果]

import type { CheckResult } from 'sparklet/shared/types/updater/updater.js';

/** Build the result for a failed release fetch [构造 Release 拉取失败的结果] */
export function buildFetchFailureResult(
  currentVersion: string,
  error: string | null,
  errorType: string | null
): CheckResult {
  return {
    hasUpdate: false,
    currentVersion,
    latestVersion: null,
    zipUrl: null,
    manifestUrl: null,
    error,
    errorType
  };
}
