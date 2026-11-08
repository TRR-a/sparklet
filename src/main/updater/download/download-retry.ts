// Download with retry [下载重试]

import { MAX_RETRY_COUNT, RETRY_DELAY_MS } from 'sparklet/main/updater/constants/constants.js';
import { classifyNetworkError } from 'sparklet/main/updater/startup/updater-error.js';
import { downloadFile } from 'sparklet/main/updater/download/download-file.js';
import type { ProgressCallback } from 'sparklet/main/updater/download/download-file.js';
import type { DownloadResult, NetworkErrorType } from 'sparklet/shared/types/updater/updater.js';

/**
 * Download with retry on failure [下载失败时自动重试]
 * @param url Download URL [下载地址]
 * @param destPath Destination file path [目标文件路径]
 * @param onProgress Optional progress callback [可选的进度回调]
 * @param retries Max retry count (default MAX_RETRY_COUNT) [最大重试次数 (默认 MAX_RETRY_COUNT)]
 */
export async function downloadWithRetry(
  url: string,
  destPath: string,
  onProgress: ProgressCallback | null = null,
  retries: number = MAX_RETRY_COUNT
): Promise<DownloadResult> {
  let lastError: string | null = null;
  let lastErrorType: NetworkErrorType | null = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`[Download] Attempt ${attempt}/${retries}: ${url}`);
    const result = await downloadFile(url, destPath, onProgress);
    if (result.success) {
      console.log('[Download] Download succeeded');
      return { success: true, error: null, errorType: null };
    }
    lastError = result.error;
    lastErrorType = (result.errorType as NetworkErrorType | null) || classifyNetworkError(result.error);
    console.warn(`[Download] Failed (${attempt}/${retries}):`, lastError, `type=${lastErrorType}`);
    if (attempt < retries) {
      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  return {
    success: false,
    error: `Download failed after ${retries} attempts: ${lastError}`,
    errorType: lastErrorType || 'unknown'
  };
}
