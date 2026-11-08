// Single file download with progress [单文件下载，带进度]
//
// Split out [已拆分]：request options → download-request.ts, throttled progress → download-progress.ts,
// response stream handling → download-response-stream.ts, failure result → download-failure.ts.

import * as https from 'https';
import * as fs from 'fs-extra';
import type { DownloadResult } from 'sparklet/shared/types/updater/updater.js';
import { buildDownloadOptions } from './download-request.js';
import type { ProgressCallback } from './download-progress.js';
import { consumeDownloadResponse } from './download-response-stream.js';
import { downloadFailure } from './download-failure.js';

export type { ProgressCallback } from './download-progress.js';

/**
 * Download a file with progress reporting [下载文件，带进度报告]
 * @param url Download URL [下载地址]
 * @param destPath Destination file path [目标文件路径]
 * @param onProgress Optional progress callback (0-100) [可选的进度回调 (0-100)]
 */
export function downloadFile(url: string, destPath: string, onProgress: ProgressCallback | null = null): Promise<DownloadResult> {
  return new Promise((resolve) => {
    const options = buildDownloadOptions(url);
    const req = https.get(options, (res) => {
      if (res.statusCode !== 200) {
        resolve(downloadFailure(`Download failed, status: ${res.statusCode}`));
        return;
      }
      consumeDownloadResponse(res, destPath, onProgress, resolve);
    });
    req.on('error', (err: Error) => {
      fs.remove(destPath).catch(() => {});
      resolve(downloadFailure(`Network error: ${err.message}`));
    });
    req.on('timeout', () => {
      req.destroy();
      fs.remove(destPath).catch(() => {});
      resolve(downloadFailure('Download timeout'));
    });
  });
}
