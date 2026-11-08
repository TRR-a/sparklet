// Download: request options [下载 - 请求参数]

import * as https from 'https';
import { URL } from 'url';
import { DOWNLOAD_TIMEOUT_MS } from 'sparklet/main/updater/constants/constants.js';

/** Build the GET options for a sparklet update download [构造 sparklet 更新下载的 GET 参数] */
export function buildDownloadOptions(url: string): https.RequestOptions {
  const urlObj = new URL(url);
  return {
    hostname: urlObj.hostname,
    path: urlObj.pathname,
    method: 'GET',
    headers: { 'User-Agent': 'Sparklet-Updater' },
    timeout: DOWNLOAD_TIMEOUT_MS
  };
}
