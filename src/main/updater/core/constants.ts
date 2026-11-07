// Updater module constants configuration - barrel [更新模块常量配置 - 汇总出口]
//
// Split out [已拆分]：GitHub info → constants-github.ts, dir names → constants-dirs.ts,
// default config & intervals → constants-default-config.ts,
// retry/timeout/filename → constants-network.ts,
// cache retention → constants-cache-retention.ts.

import {
  INTEGRITY_FILENAME_BLACKLIST,
  INTEGRITY_EXTENSION_BLACKLIST,
  isExcludedFromIntegrity
} from '../integrity/_integrity-rules.js';

export {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_API_URL,
} from './constants-github.js';
export {
  TEMP_DIR_NAMES,
  CONFIG_DIR_NAMES,
  UPDATE_CACHE_DIRNAME,
} from './constants-dirs.js';
export { DEFAULT_CONFIG, INTERVAL_OPTIONS } from './constants-default-config.js';
export {
  MAX_RETRY_COUNT,
  RETRY_DELAY_MS,
  DOWNLOAD_TIMEOUT_MS,
  REQUEST_TIMEOUT_MS,
  PACKAGE_NAME_PATTERN,
  DISABLE_UPDATE_FLAGS,
} from './constants-network.js';
export {
  DEFAULT_CACHE_SUCCESS_RETENTION_DAYS,
  CACHE_RETENTION_MIN_DAYS,
  CACHE_RETENTION_MAX_DAYS,
  CACHE_UNUSED_RETENTION_DAYS,
  CACHE_MAX_VERSIONS,
  CACHE_SUCCESS_MARK_DELAY_MS,
} from './constants-cache-retention.js';

// Backward compat: old variable name points to exact filename blacklist [向后兼容：旧变量名指向精确文件名黑名单]
export const INTEGRITY_BLACKLIST_FILENAMES = INTEGRITY_FILENAME_BLACKLIST;

export {
  INTEGRITY_FILENAME_BLACKLIST,
  INTEGRITY_EXTENSION_BLACKLIST,
  isExcludedFromIntegrity
};
