// src/main/updater/constants.js
// 更新模块常量配置

const path = require('path');
const { app } = require('electron');

// GitHub 仓库信息
const GITHUB_OWNER = 'TRR-a';
const GITHUB_REPO = 'sparklet';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

// 临时目录配置（三个候选，按优先级）
const TEMP_DIR_NAMES = [
  'Sparklet-UpdateTemp',
  'sparklet-updater',
  'sparklet-update-cache'
];

// 配置目录名（三个候选，按优先级）
const CONFIG_DIR_NAMES = [
  'SparkletConfig',
  'sparklet-config',
  '.sparkletconf'
];

// 默认配置
const DEFAULT_CONFIG = {
  updateBehavior: 'auto',      // 'auto' | 'notify-only' | 'disabled'
  checkInterval: 86400000,     // 毫秒，默认 24 小时
  lastCheckTime: null,
  autoDownload: true,
  integrityCheck: true,        // 启动时校验应用完整性（默认 true）
  cacheRetentionDays: 7        // 成功打开后保留 X 天（7~30，用户可配；未成功打开的兜底 30 天不变）
};

// 频率选项（显示文本 → 毫秒）
const INTERVAL_OPTIONS = [
  { label: '重启后', value: 0 },
  { label: '30 分钟', value: 1800000 },
  { label: '1 小时', value: 3600000 },
  { label: '1 天', value: 86400000 },
  { label: '1 周', value: 604800000 }
];

// 重试配置
const MAX_RETRY_COUNT = 6;
const RETRY_DELAY_MS = 2000;

// 超时配置
const DOWNLOAD_TIMEOUT_MS = 60000;
const REQUEST_TIMEOUT_MS = 30000;

// 命令行禁用参数
const DISABLE_UPDATE_FLAGS = ['--no-update', '--disable-update'];

// 更新包文件名格式
const PACKAGE_NAME_PATTERN = /^sparklet-v\d+\.\d+\.\d+-win-x86_64\.zip$/;

// ========== 完整性校验：黑名单（纯规则从共享模块引入，保证打包脚本和运行端一致）==========
const {
  INTEGRITY_FILENAME_BLACKLIST,
  INTEGRITY_EXTENSION_BLACKLIST,
  isExcludedFromIntegrity
} = require('./_integrity-rules');
// 向后兼容：旧变量名指向精确文件名黑名单
const INTEGRITY_BLACKLIST_FILENAMES = INTEGRITY_FILENAME_BLACKLIST;

// ========== 更新包缓存：保留策略 ==========
// 成功打开后的保留天数由用户配置（7~30，默认 7），这里只存默认值和范围
const DEFAULT_CACHE_SUCCESS_RETENTION_DAYS = 7;
const CACHE_RETENTION_MIN_DAYS = 7;
const CACHE_RETENTION_MAX_DAYS = 30;
// 没成功用过的版本（下了没装/装了没成功打开/秒崩），兜底保留 30 天（不可配置，避免误删）
const CACHE_UNUSED_RETENTION_DAYS = 30;
const CACHE_MAX_VERSIONS = 2;             // 最多同时保留 2 个版本
const CACHE_SUCCESS_MARK_DELAY_MS = 30 * 1000; // 启动后延迟 30 秒才写 successFirstLaunchAt（防秒崩）

// ========== 更新包缓存：目录名 ==========
const UPDATE_CACHE_DIRNAME = 'update_cache';

// 获取应用代码根目录（打包后指向 resources/app.asar 或 resources/app）
// ⚠️ 注意：完整性校验 filesHash 不要用这个目录，因为打包端算的是整个 win-unpacked 根
function getAppRoot() {
  return app.getAppPath();
}

// 获取安装根目录（= Sparklet.exe 所在目录，对应打包时的 win-unpacked/ 根）
// filesHash 生成端和校验端都应该用这个作为扫描根，保证范围一致
function getInstallRoot() {
  return path.dirname(process.execPath);
}

// 获取用户数据目录
function getUserDataPath() {
  return app.getPath('userData');
}

// 获取临时目录路径
function getTempPath() {
  return app.getPath('temp');
}

// 获取外部更新器路径
function getUpdaterScriptPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'updater.js');
  } else {
    return path.join(app.getAppPath(), '../resources/updater.js');
  }
}

// 获取更新包缓存目录（持久化，位于 userData 下）
function getUpdateCacheDir() {
  return path.join(getUserDataPath(), UPDATE_CACHE_DIRNAME);
}

// 获取更新包缓存的元数据文件路径（cache.json）
function getUpdateCacheMetaPath() {
  return path.join(getUpdateCacheDir(), 'cache.json');
}

/**
 * 统一分类更新流程中的网络/下载错误（给上层做友好提示用）
 * @param {string|null|undefined} errorMsg 错误消息字符串（来自 Network error: xxx / Download timeout / status: 403 等）
 * @returns {'offline'|'rate-limit'|'server-error'|'write-error'|'unknown'} 错误类型
 *   - offline      : 断网 / DNS失败 / 连接拒绝 / 超时 / 代理错误（纯网络层问题）
 *   - rate-limit   : GitHub API 限流（HTTP 403 + rate limit 关键字）
 *   - server-error : HTTP 状态码 4xx/5xx（非限流）
 *   - write-error  : 写本地磁盘失败（Write error）
 *   - unknown      : 其他（JSON 解析失败 / 文件名不合法等业务错）
 */
function classifyNetworkError(errorMsg) {
  const msg = String(errorMsg || '').toLowerCase();
  if (!msg) return 'unknown';

  // 写磁盘错误
  if (msg.startsWith('write error:')) return 'write-error';

  // GitHub 限流
  if (msg.includes('rate limit') && msg.includes('exceeded')) return 'rate-limit';

  // HTTP 非 2xx 状态码
  const statusMatch = msg.match(/status[:\s]+(\d{3})/);
  if (statusMatch) {
    const code = Number(statusMatch[1]);
    if (code === 403 && (msg.includes('ratelimit') || msg.includes('rate limit'))) return 'rate-limit';
    if (code >= 400 && code < 600) return 'server-error';
  }

  // 纯网络层错误
  if (
    msg.startsWith('network error:') ||
    msg.includes('request timeout') ||
    msg.includes('download timeout') ||
    msg.includes('enotfound') ||       // DNS 解析失败
    msg.includes('eai_again') ||       // DNS 重试失败
    msg.includes('econnrefused') ||    // 连接被拒
    msg.includes('econnreset') ||      // 连接被重置
    msg.includes('etimedout') ||       // 连接超时
    msg.includes('esockettimedout') || // Socket 超时
    msg.includes('enetunreach') ||     // 网络不可达
    msg.includes('ehostunreach') ||    // 主机不可达
    msg.includes('eproto') ||          // 协议错误
    msg.includes('ssl routines') ||    // TLS/SSL 握手中断
    msg.includes('certificate') ||     // 证书问题（用户开了抓包代理等）
    msg.includes('bad gateway') ||     // 502（代理问题，也按网络不稳定算）
    msg.includes('gateway timeout')    // 504
  ) return 'offline';

  return 'unknown';
}

module.exports = {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_API_URL,
  TEMP_DIR_NAMES,
  CONFIG_DIR_NAMES,
  DEFAULT_CONFIG,
  INTERVAL_OPTIONS,
  MAX_RETRY_COUNT,
  RETRY_DELAY_MS,
  DOWNLOAD_TIMEOUT_MS,
  REQUEST_TIMEOUT_MS,
  DISABLE_UPDATE_FLAGS,
  PACKAGE_NAME_PATTERN,
  INTEGRITY_BLACKLIST_FILENAMES,
  INTEGRITY_FILENAME_BLACKLIST,
  INTEGRITY_EXTENSION_BLACKLIST,
  isExcludedFromIntegrity,
  DEFAULT_CACHE_SUCCESS_RETENTION_DAYS,
  CACHE_RETENTION_MIN_DAYS,
  CACHE_RETENTION_MAX_DAYS,
  CACHE_UNUSED_RETENTION_DAYS,
  CACHE_MAX_VERSIONS,
  CACHE_SUCCESS_MARK_DELAY_MS,
  UPDATE_CACHE_DIRNAME,
  getAppRoot,
  getInstallRoot,
  getUserDataPath,
  getTempPath,
  getUpdaterScriptPath,
  getUpdateCacheDir,
  getUpdateCacheMetaPath,
  classifyNetworkError
};