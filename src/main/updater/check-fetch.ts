// GitHub Release fetching [GitHub Release 获取]

import * as https from 'https';
import { URL } from 'url';
import { GITHUB_API_URL, REQUEST_TIMEOUT_MS, classifyNetworkError } from './constants';
import type { ReleaseData } from './manifest-helper';
import type { NetworkErrorType } from '../../shared/types/updater';

/** Latest release fetch result [最新 Release 获取结果] */
export interface FetchReleaseResult {
  success: boolean;
  data: ReleaseData | null;
  error: string | null;
  errorType: NetworkErrorType | null;
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
