// Version check: fetch GitHub release, compare versions [版本检查：获取 GitHub Release，比较版本号]

import * as https from 'https';
import { URL } from 'url';
import { GITHUB_API_URL, REQUEST_TIMEOUT_MS, classifyNetworkError } from './constants';
import { extractAssetsFromRelease, type ReleaseData } from './manifest-helper';
import type { CheckResult } from '../../shared/types/updater';

// Get current app version from package.json [获取当前应用版本号]
export function getCurrentVersion(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // 4 levels up from build/src/main/updater to the app root in the mirrored build tree [镜像 build 树中从 build/src/main/updater 上 4 级到应用根]
  const pkg = require('../../../../package.json');
  return pkg.version || '0.0.0';
}

/**
 * Compare two version strings (e.g. "0.2.2" vs "0.2.3") [比较两个版本字符串 (如 "0.2.2" vs "0.2.3")]
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal [v1 > v2 返回 1，v1 < v2 返回 -1，相等返回 0]
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i];
    const p2 = parts2[i];
    if (isNaN(p1) || isNaN(p2)) {
      const s1 = String(parts1[i] ?? '');
      const s2 = String(parts2[i] ?? '');
      if (s1 > s2) return 1;
      if (s1 < s2) return -1;
      continue;
    }
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/** Latest release fetch result [最新 Release 获取结果] */
interface FetchReleaseResult {
  success: boolean;
  data: ReleaseData | null;
  error: string | null;
  errorType: import('../../shared/types/updater').NetworkErrorType | null;
}

/**
 * Fetch latest release info from GitHub API [从 GitHub API 获取最新 Release 信息]
 */
export async function fetchLatestRelease(): Promise<FetchReleaseResult> {
  return new Promise((resolve) => {
    const urlObj = new URL(GITHUB_API_URL);
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Sparklet-Updater',
        'Accept': 'application/vnd.github.v3+json'
      },
      timeout: REQUEST_TIMEOUT_MS
    };
    const req = https.get(options, (res) => {
      if (res.statusCode === 403) {
        const remaining = res.headers['x-ratelimit-remaining'];
        if (remaining === '0') {
          const errMsg = 'GitHub API rate limit exceeded, please try later';
          resolve({
            success: false,
            data: null,
            error: errMsg,
            errorType: classifyNetworkError(errMsg)
          });
          return;
        }
      }
      if (res.statusCode !== 200) {
        const errMsg = `GitHub API error: status ${res.statusCode}`;
        resolve({
          success: false,
          data: null,
          error: errMsg,
          errorType: classifyNetworkError(errMsg)
        });
        return;
      }
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data) as ReleaseData;
          resolve({ success: true, data: parsed, error: null, errorType: null });
        } catch (err) {
          const errMsg = 'Failed to parse GitHub API response';
          resolve({
            success: false,
            data: null,
            error: errMsg,
            errorType: classifyNetworkError(errMsg)
          });
        }
      });
    });
    req.on('error', (err: Error) => {
      const errMsg = `Network error: ${err.message}`;
      resolve({
        success: false,
        data: null,
        error: errMsg,
        errorType: classifyNetworkError(errMsg)
      });
    });
    req.on('timeout', () => {
      req.destroy();
      const errMsg = 'Request timeout';
      resolve({
        success: false,
        data: null,
        error: errMsg,
        errorType: classifyNetworkError(errMsg)
      });
    });
  });
}

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
  const latestTag = data?.tag_name || '';
  const latestVersion = latestTag.startsWith('v') ? latestTag.slice(1) : latestTag;
  const { zipUrl, manifestUrl } = extractAssetsFromRelease(data);

  if (!latestTag.startsWith('v')) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion,
      zipUrl: null,
      manifestUrl: null,
      error: `Invalid tag format: ${latestTag} does not start with 'v'`,
      errorType: 'unknown'
    };
  }
  const versionPattern = /^v\d+\.\d+\.\d+$/;
  if (!versionPattern.test(latestTag)) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion,
      zipUrl: null,
      manifestUrl: null,
      error: `Invalid tag format: ${latestTag} does not match vX.X.X`,
      errorType: 'unknown'
    };
  }
  if (zipUrl) {
    const zipFileName = zipUrl.split('/').pop() || '';
    // Match new format [匹配新格式]
    const fileNamePattern = /^sparklet-v\d+\.\d+\.\d+-win-x86_64\.zip$/;
    if (!fileNamePattern.test(zipFileName)) {
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion,
        zipUrl: null,
        manifestUrl: null,
        error: `Invalid zip filename: ${zipFileName}`,
        errorType: 'unknown'
      };
    }
  } else {
    console.log('[UpdateCheck] No update package found, treating as no update');
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion,
      zipUrl: null,
      manifestUrl: null,
      error: null,
      errorType: null
    };
  }
  if (!manifestUrl) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion,
      zipUrl: null,
      manifestUrl: null,
      error: 'manifest.releases.json not found',
      errorType: 'unknown'
    };
  }
  const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
  console.log('[UpdateCheck] Latest version:', latestVersion, 'Has update:', hasUpdate);
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
