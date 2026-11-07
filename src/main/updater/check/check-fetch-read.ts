// GitHub release fetch: response reading [GitHub Release 获取 - 响应读取]

import type { IncomingMessage } from 'http';

/** Raw body/error from an HTTP response [来自 HTTP 响应的正文/错误] */
export interface ResponseOutcome {
  error: string | null;
  body: string | null;
}

/**
 * Read the response of the latest-release API and resolve with raw JSON text
 * [读取最新 Release API 的响应并返回原始 JSON 文本]
 */
export function readLatestReleaseResponse(
  res: IncomingMessage,
  resolve: (outcome: ResponseOutcome) => void
): void {
  if (res.statusCode === 403) {
    const remaining = res.headers['x-ratelimit-remaining'];
    if (remaining === '0') {
      resolve({ error: 'GitHub API rate limit exceeded, please try later', body: null });
      return;
    }
  }
  if (res.statusCode !== 200) {
    resolve({ error: `GitHub API error: status ${res.statusCode}`, body: null });
    return;
  }
  let data = '';
  res.on('data', (chunk: Buffer) => { data += chunk; });
  res.on('end', () => {
    try {
      JSON.parse(data);
      resolve({ error: null, body: data });
    } catch {
      resolve({ error: 'Failed to parse GitHub API response', body: null });
    }
  });
}
