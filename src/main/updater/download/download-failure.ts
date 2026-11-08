// Download: failure result builder [下载 - 失败结果构造]

import { classifyNetworkError } from 'sparklet/main/updater/startup/updater-error.js';
import type { DownloadResult } from 'sparklet/shared/types/updater/updater.js';

/** Build a failed download result with a classified error type [构造失败的下载结果，含归类后的错误类型] */
export function downloadFailure(error: string): DownloadResult {
  return {
    success: false,
    error,
    errorType: classifyNetworkError(error)
  };
}
