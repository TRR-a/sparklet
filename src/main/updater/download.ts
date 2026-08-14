// Download management: download with progress and retry [下载管理：带进度和重试的下载]

import * as https from 'https';
import * as fs from 'fs-extra';
import * as path from 'path';
import { URL } from 'url';
import {
  DOWNLOAD_TIMEOUT_MS,
  MAX_RETRY_COUNT,
  RETRY_DELAY_MS,
  classifyNetworkError
} from './constants';
import type { DownloadResult, NetworkErrorType } from '../../shared/types/updater';

/** Progress callback type [进度回调类型] */
type ProgressCallback = (percent: number) => void;

/**
 * Download a file with progress reporting [下载文件，带进度报告]
 * @param url Download URL [下载地址]
 * @param destPath Destination file path [目标文件路径]
 * @param onProgress Optional progress callback (0-100) [可选的进度回调 (0-100)]
 */
export function downloadFile(url: string, destPath: string, onProgress: ProgressCallback | null = null): Promise<DownloadResult> {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: { 'User-Agent': 'Sparklet-Updater' },
      timeout: DOWNLOAD_TIMEOUT_MS
    };
    const req = https.get(options, (res) => {
      if (res.statusCode !== 200) {
        const errMsg = `Download failed, status: ${res.statusCode}`;
        resolve({
          success: false,
          error: errMsg,
          errorType: classifyNetworkError(errMsg)
        });
        return;
      }
      const totalSize = parseInt(res.headers['content-length'] || '0', 10);
      let downloadedSize = 0;
      let lastEmitTime = Date.now();
      const fileStream = fs.createWriteStream(destPath);
      res.on('data', (chunk: Buffer) => {
        downloadedSize += chunk.length;
        if (onProgress && totalSize > 0) {
          const now = Date.now();
          if (now - lastEmitTime > 200) {
            const percent = Math.round((downloadedSize / totalSize) * 100);
            onProgress(Math.min(percent, 100));
            lastEmitTime = now;
          }
        }
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
    });
    req.on('error', (err: Error) => {
      fs.remove(destPath).catch(() => {});
      const errMsg = `Network error: ${err.message}`;
      resolve({
        success: false,
        error: errMsg,
        errorType: classifyNetworkError(errMsg)
      });
    });
    req.on('timeout', () => {
      req.destroy();
      fs.remove(destPath).catch(() => {});
      const errMsg = 'Download timeout';
      resolve({
        success: false,
        error: errMsg,
        errorType: classifyNetworkError(errMsg)
      });
    });
  });
}

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
