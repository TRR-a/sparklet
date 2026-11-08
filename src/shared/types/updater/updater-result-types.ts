// Updater operation result types [更新操作结果类型]

import type { ManifestEntry } from 'sparklet/shared/types/updater/updater-manifest-types.js';

/** Update check result [更新检查结果] */
export interface CheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string | null;
  zipUrl: string | null;
  manifestUrl: string | null;
  error: string | null;
  errorType: string | null;
}

/** Download result [下载结果] */
export interface DownloadResult {
  success: boolean;
  error: string | null;
  errorType: string | null;
}

/** Verify result [校验结果] */
export interface VerifyResult {
  success: boolean;
  error: string | null;
  entry?: ManifestEntry | null;
}

/** Install result [安装结果] */
export interface InstallResult {
  success: boolean;
  error: string | null;
  logFile?: string;
}
