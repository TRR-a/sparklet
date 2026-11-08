// Update check: invalid-release result [更新检查 - 无效 Release 结果]

import type { CheckResult } from 'sparklet/shared/types/updater/updater.js';

/** Build the result for a release that carries no usable package [构造无可用安装包的 Release 结果] */
export function buildInvalidReleaseResult(
  currentVersion: string,
  latestVersion: string | null,
  zipUrl: string | null,
  manifestUrl: string | null,
  error: string | null,
  errorType: string | null
): CheckResult {
  return {
    hasUpdate: false,
    currentVersion,
    latestVersion,
    zipUrl,
    manifestUrl,
    error,
    errorType
  };
}
