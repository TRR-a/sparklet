// Updater types - barrel [更新模块类型 - 汇总出口]
// Split out [已拆分]：config → updater-config-types.ts, manifest → updater-manifest-types.ts,
// results → updater-result-types.ts, cache → updater-cache-types.ts,
// dialog/toast → updater-dialog-payload.ts, temp/network → updater-misc-types.ts.

export type { UpdaterConfig } from './updater-config-types.js';
export type { ManifestEntry } from './updater-manifest-types.js';
export type { CheckResult, DownloadResult, VerifyResult, InstallResult } from './updater-result-types.js';
export type { CacheEntry, CacheMeta, CacheInfo, VerifyCachedZipResult } from './updater-cache-types.js';
export type { ToastData, DialogPayload, DialogResponse } from './updater-dialog-payload.js';
export type { TempDirResult, NetworkErrorType } from './updater-misc-types.js';
