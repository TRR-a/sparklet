// GitHub Release fetching [GitHub Release 获取]
//
// Split out [已拆分]：result type → check-fetch-result.ts,
// raw HTTP request → check-fetch-request.ts.

import { classifyNetworkError } from 'sparklet/main/updater/startup/updater-error.js';
import type { ReleaseData } from 'sparklet/main/updater/manifest/manifest-helper.js';
import { requestLatestRelease } from 'sparklet/main/updater/check/check-fetch-request.js';
import { failFetchResult, okFetchResult } from 'sparklet/main/updater/check/check-fetch-result.js';
import type { FetchReleaseResult } from 'sparklet/main/updater/check/check-fetch-result.js';

export type { FetchReleaseResult } from 'sparklet/main/updater/check/check-fetch-result.js';

/**
 * Fetch latest release info from GitHub API [从 GitHub API 获取最新 Release 信息]
 */
export async function fetchLatestRelease(): Promise<FetchReleaseResult> {
  const raw = await requestLatestRelease();
  if (raw.error || raw.body === null) {
    const errMsg = raw.error || 'Failed to fetch GitHub API response';
    return { ...failFetchResult(errMsg), errorType: classifyNetworkError(errMsg) };
  }
  return okFetchResult(JSON.parse(raw.body) as ReleaseData);
}
