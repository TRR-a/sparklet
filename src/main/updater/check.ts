// Update check orchestration entry [更新检查编排入口]
// Re-exports getCurrentVersion so existing importers keep their paths unchanged
// [重新导出 getCurrentVersion，使已有导入路径保持不变]

import { classifyNetworkError } from './constants';
import type { CheckResult } from '../../shared/types/updater';
import { getCurrentVersion, compareVersions } from './check-version';
import { fetchLatestRelease } from './check-fetch';
import { validateRelease } from './check-manifest';

export { getCurrentVersion } from './check-version';

/**
 * Check for updates by fetching latest GitHub release and comparing versions [通过获取最新 GitHub Release 并比较版本来检查更新]
 */
export async function checkForUpdates(): Promise<CheckResult> {
  const currentVersion = getCurrentVersion();
  console.log('[UpdateCheck] Current version:', currentVersion);

  const { success, data, error, errorType: fetchErrorType } = await fetchLatestRelease();
  if (!success) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: null,
      zipUrl: null,
      manifestUrl: null,
      error,
      errorType: fetchErrorType || classifyNetworkError(error)
    };
  }

  const result = validateRelease(data);
  if (!result.valid) {
    console.log('[UpdateCheck] Release validation failed:', result.error || 'no update package');
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: result.latestVersion,
      zipUrl: result.zipUrl,
      manifestUrl: result.manifestUrl,
      error: result.error,
      errorType: result.errorType
    };
  }

  const hasUpdate = compareVersions(result.latestVersion, currentVersion) > 0;
  console.log('[UpdateCheck] Latest version:', result.latestVersion, 'Has update:', hasUpdate);
  return {
    hasUpdate,
    currentVersion,
    latestVersion: result.latestVersion,
    zipUrl: result.zipUrl,
    manifestUrl: result.manifestUrl,
    error: null,
    errorType: null
  };
}
