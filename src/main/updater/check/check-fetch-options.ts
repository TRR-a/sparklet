// GitHub release fetch: request options [GitHub Release 获取 - 请求参数]

import { URL } from 'url';
import * as https from 'https';
import { GITHUB_API_URL, REQUEST_TIMEOUT_MS } from '../core/constants.js';

/** Build the https request options for the latest-release API [构造最新 Release API 的 https 请求参数] */
export function buildLatestReleaseRequestOptions(): https.RequestOptions {
  const urlObj = new URL(GITHUB_API_URL);
  return {
    hostname: urlObj.hostname,
    path: urlObj.pathname,
    method: 'GET',
    headers: {
      'User-Agent': 'Sparklet-Updater',
      'Accept': 'application/vnd.github.v3+json'
    },
    timeout: REQUEST_TIMEOUT_MS
  };
}
