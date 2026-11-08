// Update check orchestration entry [更新检查编排入口]
// Re-exports getCurrentVersion so existing importers keep their paths unchanged
// [重新导出 getCurrentVersion，使已有导入路径保持不变]
//
// Split out [已拆分]：result builders → check-results.ts.

import { classifyNetworkError } from '../startup/updater-error.js';
import type { CheckResult } from 'sparklet/shared/types/updater/updater.js';
import { getCurrentVersion, compareVersions } from './check-version.js';
import { fetchLatestRelease } from './check-fetch.js';
import { validateRelease } from './check-manifest.js';
import { buildFetchFailureResult, buildInvalidReleaseResult, buildCheckResult } from './check-results.js';

export { getCurrentVersion } from './check-version.js';

/**
 * Check for updates by fetching latest GitHub release and comparing versions [通过获取最新 GitHub Release 并比较版本来检查更新]
 */
export async function checkForUpdates(): Promise<CheckResult> {
  const currentVersion = getCurrentVersion();
  console.log('[UpdateCheck] Current version:', currentVersion);

  const { success, data, error, errorType: fetchErrorType } = await fetchLatestRelease();
  if (!success) {
    return buildFetchFailureResult(currentVersion, error, fetchErrorType || classifyNetworkError(error));
  }

  const result = validateRelease(data);
  if (!result.valid) {
    console.log('[UpdateCheck] Release validation failed:', result.error || 'no update package');
    return buildInvalidReleaseResult(
      currentVersion, result.latestVersion, result.zipUrl, result.manifestUrl, result.error, result.errorType
    );
  }

  const hasUpdate = compareVersions(result.latestVersion, currentVersion) > 0;
  console.log('[UpdateCheck] Latest version:', result.latestVersion, 'Has update:', hasUpdate);
  return buildCheckResult(
    hasUpdate, currentVersion, result.latestVersion, result.zipUrl, result.manifestUrl
  );
}
