// Updater types - barrel [更新模块类型 - 汇总出口]
// Split out [已拆分]：config → updater-config-types.ts, manifest → updater-manifest-types.ts,
// results → updater-result-types.ts, cache → updater-cache-types.ts,
// dialog/toast → updater-dialog-payload.ts, temp/network → updater-misc-types.ts.

export type { UpdaterConfig } from 'sparklet/shared/types/updater/updater-config-types.js';
export type { ManifestEntry } from 'sparklet/shared/types/updater/updater-manifest-types.js';
export type { CheckResult, DownloadResult, VerifyResult, InstallResult } from 'sparklet/shared/types/updater/updater-result-types.js';
export type { CacheEntry, CacheMeta, CacheInfo, VerifyCachedZipResult } from 'sparklet/shared/types/updater/updater-cache-types.js';
export type { ToastData, DialogPayload, DialogResponse } from 'sparklet/shared/types/updater/updater-dialog-payload.js';
export type { TempDirResult, NetworkErrorType } from 'sparklet/shared/types/updater/updater-misc-types.js';
