// GitHub release fetch: raw HTTP request [GitHub Release 获取 - 原始 HTTP 请求]
//
// Split out [已拆分]：request options → check-fetch-options.ts,
// response reading → check-fetch-read.ts.

import * as https from 'https';
import { buildLatestReleaseRequestOptions } from 'sparklet/main/updater/check/check-fetch-options.js';
import { readLatestReleaseResponse } from 'sparklet/main/updater/check/check-fetch-read.js';

/** Raw HTTP outcome [原始 HTTP 结果] */
export interface RawFetchOutcome {
  /** Error message when the request/status/parse failed [请求/状态/解析失败时的错误信息] */
  error: string | null;
  /** Response body when successful [成功时的响应正文] */
  body: string | null;
}

/**
 * GET the GitHub latest-release API and return raw JSON text
 * [请求 GitHub 最新 Release API 并返回原始 JSON 文本]
 */
export async function requestLatestRelease(): Promise<RawFetchOutcome> {
  return new Promise((resolve) => {
    const options = buildLatestReleaseRequestOptions();
    const req = https.get(options, (res) => {
      readLatestReleaseResponse(res, resolve);
    });
    req.on('error', (err: Error) => {
      resolve({ error: `Network error: ${err.message}`, body: null });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Request timeout', body: null });
    });
  });
}
