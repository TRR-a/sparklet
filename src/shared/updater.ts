// Updater types [更新模块类型]

/** Updater configuration [更新配置] */
export interface UpdaterConfig {
  updateBehavior: 'auto' | 'notify-only' | 'disabled';
  checkInterval: number;
  lastCheckTime: string | null;
  autoDownload: boolean;
  integrityCheck: boolean;
  cacheRetentionDays: number;
}

/** Manifest entry [清单条目] */
export interface ManifestEntry {
  version: string;
  internalCodename?: string;
  description?: string;
  license?: string;
  releaseDate?: string;
  packageHash?: string;
  exeHash?: string;
  filesHash?: string;
  hash?: string;
}

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

/** Cache entry for a version [版本缓存条目] */
export interface CacheEntry {
  version: string;
  zipFilename: string;
  packageHash: string | null;
  downloadedAt: string;
  successFirstLaunchAt: string | null;
}

/** Cache metadata [缓存元数据] */
export interface CacheMeta {
  versions: Record<string, CacheEntry>;
}

/** Cache info for settings page [设置页缓存信息] */
export interface CacheInfo {
  hasCache: boolean;
  version: string | null;
  zipFilename: string | null;
  sizeBytes: number;
  sizeFormatted: string;
  downloadedAt: string | null;
  successFirstLaunchAt: string | null;
  retentionStrategy: string | null;
  retentionDays: number | null;
  remainingDays: number | null;
  totalCachedVersions: number;
}

/** Toast message data [Toast 消息数据] */
export interface ToastData {
  message: string | { key: string; params?: Record<string, string> };
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}

/** Updater dialog payload [更新器弹窗负载] */
export interface DialogPayload {
  dialogId: string;
  dialogType: string;
  params: Record<string, unknown>;
  timeoutMs: number;
}

/** Updater dialog response [更新器弹窗响应] */
export interface DialogResponse {
  buttonIndex: number;
  timedOut?: boolean;
}

/** Cached zip verify result [缓存 ZIP 校验结果] */
export interface VerifyCachedZipResult {
  ok: boolean;
  zipPath: string | null;
  packageHash?: string;
  reason?: string;
  actualHash?: string;
  expectedHash?: string;
}

/** Temp directory acquire result [临时目录获取结果] */
export interface TempDirResult {
  success: boolean;
  path: string | null;
  isManual: boolean;
  error?: string;
}

/** Network error type [网络错误类型] */
export type NetworkErrorType = 'offline' | 'rate-limit' | 'server-error' | 'write-error' | 'unknown';
