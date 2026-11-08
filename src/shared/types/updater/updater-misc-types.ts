// Updater misc types: temp dir + network error [更新杂项类型 - 临时目录与网络错误]

/** Temp directory acquire result [临时目录获取结果] */
export interface TempDirResult {
  success: boolean;
  path: string | null;
  isManual: boolean;
  error?: string;
}

/** Network error type [网络错误类型] */
export type NetworkErrorType = 'offline' | 'rate-limit' | 'server-error' | 'write-error' | 'unknown';
