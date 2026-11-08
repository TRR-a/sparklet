// Download: consume the HTTP response stream [下载 - 消费 HTTP 响应流]

import * as fs from 'fs-extra';
import type { IncomingMessage } from 'http';
import { classifyNetworkError } from 'sparklet/main/updater/startup/updater-error.js';
import type { DownloadResult } from 'sparklet/shared/types/updater/updater.js';
import type { ProgressCallback } from 'sparklet/main/updater/download/download-progress.js';
import { createProgressReporter } from 'sparklet/main/updater/download/download-progress.js';

/**
 * Pipe a 200 response into the destination file and report progress [把 200 响应写入目标文件并报告进度]
 */
export function consumeDownloadResponse(
  res: IncomingMessage,
  destPath: string,
  onProgress: ProgressCallback | null,
  resolve: (result: DownloadResult) => void
): void {
  const totalSize = parseInt(res.headers['content-length'] || '0', 10);
  let downloadedSize = 0;
  const reportProgress = createProgressReporter(totalSize, onProgress);
  const fileStream = fs.createWriteStream(destPath);
  res.on('data', (chunk: Buffer) => {
    downloadedSize += chunk.length;
    reportProgress(downloadedSize);
  });
  res.pipe(fileStream);
  fileStream.on('finish', () => {
    if (onProgress) onProgress(100);
    resolve({ success: true, error: null, errorType: null });
  });
  fileStream.on('error', (err: Error) => {
    fs.remove(destPath).catch(() => {});
    const errMsg = `Write error: ${err.message}`;
    resolve({
      success: false,
      error: errMsg,
      errorType: classifyNetworkError(errMsg)
    });
  });
}
