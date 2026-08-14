"use strict";
// Updater module constants configuration [更新模块常量配置]
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPDATE_CACHE_DIRNAME = exports.CACHE_SUCCESS_MARK_DELAY_MS = exports.CACHE_MAX_VERSIONS = exports.CACHE_UNUSED_RETENTION_DAYS = exports.CACHE_RETENTION_MAX_DAYS = exports.CACHE_RETENTION_MIN_DAYS = exports.DEFAULT_CACHE_SUCCESS_RETENTION_DAYS = exports.isExcludedFromIntegrity = exports.INTEGRITY_EXTENSION_BLACKLIST = exports.INTEGRITY_FILENAME_BLACKLIST = exports.INTEGRITY_BLACKLIST_FILENAMES = exports.PACKAGE_NAME_PATTERN = exports.DISABLE_UPDATE_FLAGS = exports.REQUEST_TIMEOUT_MS = exports.DOWNLOAD_TIMEOUT_MS = exports.RETRY_DELAY_MS = exports.MAX_RETRY_COUNT = exports.INTERVAL_OPTIONS = exports.DEFAULT_CONFIG = exports.CONFIG_DIR_NAMES = exports.TEMP_DIR_NAMES = exports.GITHUB_API_URL = exports.GITHUB_REPO = exports.GITHUB_OWNER = void 0;
exports.getAppRoot = getAppRoot;
exports.getInstallRoot = getInstallRoot;
exports.getUserDataPath = getUserDataPath;
exports.getTempPath = getTempPath;
exports.getUpdaterScriptPath = getUpdaterScriptPath;
exports.getUpdateCacheDir = getUpdateCacheDir;
exports.getUpdateCacheMetaPath = getUpdateCacheMetaPath;
exports.classifyNetworkError = classifyNetworkError;
const path = __importStar(require("path"));
const electron_1 = require("electron");
const _integrity_rules_1 = require("./_integrity-rules");
Object.defineProperty(exports, "INTEGRITY_FILENAME_BLACKLIST", { enumerable: true, get: function () { return _integrity_rules_1.INTEGRITY_FILENAME_BLACKLIST; } });
Object.defineProperty(exports, "INTEGRITY_EXTENSION_BLACKLIST", { enumerable: true, get: function () { return _integrity_rules_1.INTEGRITY_EXTENSION_BLACKLIST; } });
Object.defineProperty(exports, "isExcludedFromIntegrity", { enumerable: true, get: function () { return _integrity_rules_1.isExcludedFromIntegrity; } });
// GitHub repository info [GitHub 仓库信息]
exports.GITHUB_OWNER = 'TRR-a';
exports.GITHUB_REPO = 'sparklet';
exports.GITHUB_API_URL = `https://api.github.com/repos/${exports.GITHUB_OWNER}/${exports.GITHUB_REPO}/releases/latest`;
// Temp directory config (three candidates, by priority) [临时目录配置 (三个候选，按优先级)]
exports.TEMP_DIR_NAMES = [
    'Sparklet-UpdateTemp',
    'sparklet-updater',
    'sparklet-update-cache'
];
// Config directory names (three candidates, by priority) [配置目录名 (三个候选，按优先级)]
exports.CONFIG_DIR_NAMES = [
    'SparkletConfig',
    'sparklet-config',
    '.sparkletconf'
];
// Default config [默认配置]
exports.DEFAULT_CONFIG = {
    updateBehavior: 'auto', // 'auto' | 'notify-only' | 'disabled'
    checkInterval: 86400000, // ms, default 24 hours [毫秒，默认 24 小时]
    lastCheckTime: null,
    autoDownload: true,
    integrityCheck: true, // Verify app integrity on startup (default true) [启动时校验应用完整性 (默认 true)]
    cacheRetentionDays: 7 // Retain X days after successful launch (7~30, user configurable; fallback 30 days if never launched) [成功打开后保留 X 天 (7~30，用户可配；未成功打开的兜底 30 天不变)]
};
// Interval options (display text -> milliseconds) [频率选项 (显示文本 → 毫秒)]
exports.INTERVAL_OPTIONS = [
    { label: '重启后', value: 0 },
    { label: '30 分钟', value: 1800000 },
    { label: '1 小时', value: 3600000 },
    { label: '1 天', value: 86400000 },
    { label: '1 周', value: 604800000 }
];
// Retry config [重试配置]
exports.MAX_RETRY_COUNT = 6;
exports.RETRY_DELAY_MS = 2000;
// Timeout config [超时配置]
exports.DOWNLOAD_TIMEOUT_MS = 60000;
exports.REQUEST_TIMEOUT_MS = 30000;
// Command-line disable flags [命令行禁用参数]
exports.DISABLE_UPDATE_FLAGS = ['--no-update', '--disable-update'];
// Update package filename pattern [更新包文件名格式]
exports.PACKAGE_NAME_PATTERN = /^sparklet-v\d+\.\d+\.\d+-win-x86_64\.zip$/;
// Backward compat: old variable name points to exact filename blacklist [向后兼容：旧变量名指向精确文件名黑名单]
exports.INTEGRITY_BLACKLIST_FILENAMES = _integrity_rules_1.INTEGRITY_FILENAME_BLACKLIST;
// ========== Update package cache: retention policy ========== [更新包缓存：保留策略]
// Retention days after successful launch is user-configurable (7~30, default 7); here we only store default and range [成功打开后的保留天数由用户配置 (7~30，默认 7)，这里只存默认值和范围]
exports.DEFAULT_CACHE_SUCCESS_RETENTION_DAYS = 7;
exports.CACHE_RETENTION_MIN_DAYS = 7;
exports.CACHE_RETENTION_MAX_DAYS = 30;
// Fallback retention for unused versions (downloaded but never installed/launched/crashed on launch): 30 days (not configurable, to avoid accidental deletion) [没成功用过的版本 (下了没装/装了没成功打开/秒崩)，兜底保留 30 天 (不可配置，避免误删)]
exports.CACHE_UNUSED_RETENTION_DAYS = 30;
exports.CACHE_MAX_VERSIONS = 2; // Keep at most 2 versions simultaneously [最多同时保留 2 个版本]
exports.CACHE_SUCCESS_MARK_DELAY_MS = 30 * 1000; // Delay 30s after startup before writing successFirstLaunchAt (anti-instant-crash) [启动后延迟 30 秒才写 successFirstLaunchAt (防秒崩)]
// ========== Update package cache: directory name ========== [更新包缓存：目录名]
exports.UPDATE_CACHE_DIRNAME = 'update_cache';
// Get app code root directory (after packaging points to resources/app.asar or resources/app) [获取应用代码根目录 (打包后指向 resources/app.asar 或 resources/app)]
// Note: do NOT use this directory for filesHash integrity check, because the packaging side computes hash over the entire win-unpacked root [注意：完整性校验 filesHash 不要用这个目录，因为打包端算的是整个 win-unpacked 根]
function getAppRoot() {
    return electron_1.app.getAppPath();
}
// Get install root directory (= Sparklet.exe directory, corresponds to win-unpacked/ root at packaging time) [获取安装根目录 (= Sparklet.exe 所在目录，对应打包时的 win-unpacked/ 根)]
// Both filesHash generation and verification should use this as scan root to ensure consistent scope [filesHash 生成端和校验端都应该用这个作为扫描根，保证范围一致]
function getInstallRoot() {
    return path.dirname(process.execPath);
}
// Get user data directory [获取用户数据目录]
function getUserDataPath() {
    return electron_1.app.getPath('userData');
}
// Get temp directory path [获取临时目录路径]
function getTempPath() {
    return electron_1.app.getPath('temp');
}
// Get external updater script path [获取外部更新器路径]
function getUpdaterScriptPath() {
    if (electron_1.app.isPackaged) {
        return path.join(process.resourcesPath, 'updater.js');
    }
    else {
        return path.join(electron_1.app.getAppPath(), '../resources/updater.js');
    }
}
// Get update package cache directory (persistent, under userData) [获取更新包缓存目录 (持久化，位于 userData 下)]
function getUpdateCacheDir() {
    return path.join(getUserDataPath(), exports.UPDATE_CACHE_DIRNAME);
}
// Get update package cache metadata file path (cache.json) [获取更新包缓存的元数据文件路径 (cache.json)]
function getUpdateCacheMetaPath() {
    return path.join(getUpdateCacheDir(), 'cache.json');
}
/**
 * Classify network/download errors in update flow (for friendly prompts to user) [统一分类更新流程中的网络/下载错误 (给上层做友好提示用)]
 * @param errorMsg Error message string (from Network error: xxx / Download timeout / status: 403 etc.) [错误消息字符串 (来自 Network error: xxx / Download timeout / status: 403 等)]
 * @returns Error type [错误类型]
 *   - offline      : No network / DNS failure / connection refused / timeout / proxy error (pure network layer) [断网 / DNS失败 / 连接拒绝 / 超时 / 代理错误 (纯网络层问题)]
 *   - rate-limit   : GitHub API rate limit (HTTP 403 + rate limit keyword) [GitHub API 限流 (HTTP 403 + rate limit 关键字)]
 *   - server-error : HTTP status 4xx/5xx (non-rate-limit) [HTTP 状态码 4xx/5xx (非限流)]
 *   - write-error  : Local disk write failure (Write error) [写本地磁盘失败 (Write error)]
 *   - unknown      : Other (JSON parse failure / invalid filename etc.) [其他 (JSON 解析失败 / 文件名不合法等业务错)]
 */
function classifyNetworkError(errorMsg) {
    const msg = String(errorMsg || '').toLowerCase();
    if (!msg)
        return 'unknown';
    // Disk write error [写磁盘错误]
    if (msg.startsWith('write error:'))
        return 'write-error';
    // GitHub rate limit [GitHub 限流]
    if (msg.includes('rate limit') && msg.includes('exceeded'))
        return 'rate-limit';
    // HTTP non-2xx status code [HTTP 非 2xx 状态码]
    const statusMatch = msg.match(/status[:\s]+(\d{3})/);
    if (statusMatch) {
        const code = Number(statusMatch[1]);
        if (code === 403 && (msg.includes('ratelimit') || msg.includes('rate limit')))
            return 'rate-limit';
        if (code >= 400 && code < 600)
            return 'server-error';
    }
    // Pure network layer errors [纯网络层错误]
    if (msg.startsWith('network error:') ||
        msg.includes('request timeout') ||
        msg.includes('download timeout') ||
        msg.includes('enotfound') || // DNS resolution failure [DNS 解析失败]
        msg.includes('eai_again') || // DNS retry failure [DNS 重试失败]
        msg.includes('econnrefused') || // Connection refused [连接被拒]
        msg.includes('econnreset') || // Connection reset [连接被重置]
        msg.includes('etimedout') || // Connection timeout [连接超时]
        msg.includes('esockettimedout') || // Socket timeout [Socket 超时]
        msg.includes('enetunreach') || // Network unreachable [网络不可达]
        msg.includes('ehostunreach') || // Host unreachable [主机不可达]
        msg.includes('eproto') || // Protocol error [协议错误]
        msg.includes('ssl routines') || // TLS/SSL handshake interrupted [TLS/SSL 握手中断]
        msg.includes('certificate') || // Certificate issue (user has proxy/sniffer etc.) [证书问题 (用户开了抓包代理等)]
        msg.includes('bad gateway') || // 502 (proxy issue, also counts as network instability) [502 (代理问题，也按网络不稳定算)]
        msg.includes('gateway timeout') // 504
    )
        return 'offline';
    return 'unknown';
}
//# sourceMappingURL=constants.js.map