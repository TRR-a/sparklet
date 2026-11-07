// Update check: success result [更新检查 - 成功结果]

import type { CheckResult } from 'sparklet/shared/types/updater';

/** Build the final, validated compare result [构造校验通过后的比较结果] */
export function buildCheckResult(
  hasUpdate: boolean,
  currentVersion: string,
  latestVersion: string,
  zipUrl: string | null,
  manifestUrl: string | null
): CheckResult {
  return {
    hasUpdate,
    currentVersion,
    latestVersion,
    zipUrl,
    manifestUrl,
    error: null,
    errorType: null
  };
}
