"use strict";
// Version check: fetch GitHub release, compare versions [版本检查：获取 GitHub Release，比较版本号]
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
exports.getCurrentVersion = getCurrentVersion;
exports.compareVersions = compareVersions;
exports.fetchLatestRelease = fetchLatestRelease;
exports.checkForUpdates = checkForUpdates;
const https = __importStar(require("https"));
const url_1 = require("url");
const constants_1 = require("./constants");
const manifest_helper_1 = require("./manifest-helper");
// Get current app version from package.json [获取当前应用版本号]
function getCurrentVersion() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('../../../package.json');
    return pkg.version || '0.0.0';
}
/**
 * Compare two version strings (e.g. "0.2.2" vs "0.2.3") [比较两个版本字符串 (如 "0.2.2" vs "0.2.3")]
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal [v1 > v2 返回 1，v1 < v2 返回 -1，相等返回 0]
 */
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i];
        const p2 = parts2[i];
        if (isNaN(p1) || isNaN(p2)) {
            const s1 = String(parts1[i] ?? '');
            const s2 = String(parts2[i] ?? '');
            if (s1 > s2)
                return 1;
            if (s1 < s2)
                return -1;
            continue;
        }
        if (p1 > p2)
            return 1;
        if (p1 < p2)
            return -1;
    }
    return 0;
}
/**
 * Fetch latest release info from GitHub API [从 GitHub API 获取最新 Release 信息]
 */
async function fetchLatestRelease() {
    return new Promise((resolve) => {
        const urlObj = new url_1.URL(constants_1.GITHUB_API_URL);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'Sparklet-Updater',
                'Accept': 'application/vnd.github.v3+json'
            },
            timeout: constants_1.REQUEST_TIMEOUT_MS
        };
        const req = https.get(options, (res) => {
            if (res.statusCode === 403) {
                const remaining = res.headers['x-ratelimit-remaining'];
                if (remaining === '0') {
                    const errMsg = 'GitHub API rate limit exceeded, please try later';
                    resolve({
                        success: false,
                        data: null,
                        error: errMsg,
                        errorType: (0, constants_1.classifyNetworkError)(errMsg)
                    });
                    return;
                }
            }
            if (res.statusCode !== 200) {
                const errMsg = `GitHub API error: status ${res.statusCode}`;
                resolve({
                    success: false,
                    data: null,
                    error: errMsg,
                    errorType: (0, constants_1.classifyNetworkError)(errMsg)
                });
                return;
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ success: true, data: parsed, error: null, errorType: null });
                }
                catch (err) {
                    const errMsg = 'Failed to parse GitHub API response';
                    resolve({
                        success: false,
                        data: null,
                        error: errMsg,
                        errorType: (0, constants_1.classifyNetworkError)(errMsg)
                    });
                }
            });
        });
        req.on('error', (err) => {
            const errMsg = `Network error: ${err.message}`;
            resolve({
                success: false,
                data: null,
                error: errMsg,
                errorType: (0, constants_1.classifyNetworkError)(errMsg)
            });
        });
        req.on('timeout', () => {
            req.destroy();
            const errMsg = 'Request timeout';
            resolve({
                success: false,
                data: null,
                error: errMsg,
                errorType: (0, constants_1.classifyNetworkError)(errMsg)
            });
        });
    });
}
/**
 * Check for updates by fetching latest GitHub release and comparing versions [通过获取最新 GitHub Release 并比较版本来检查更新]
 */
async function checkForUpdates() {
    const currentVersion = getCurrentVersion();
    console.log('[UpdateCheck] Current version:', currentVersion);
    const { success, data, error, errorType: fetchErrorType } = await fetchLatestRelease();
    if (!success) {
        return {
            hasUpdate: false,
            currentVersion,
            latestVersion: null,
            zipUrl: null,
            manifestUrl: null,
            error,
            errorType: fetchErrorType || (0, constants_1.classifyNetworkError)(error)
        };
    }
    const latestTag = data?.tag_name || '';
    const latestVersion = latestTag.startsWith('v') ? latestTag.slice(1) : latestTag;
    const { zipUrl, manifestUrl } = (0, manifest_helper_1.extractAssetsFromRelease)(data);
    if (!latestTag.startsWith('v')) {
        return {
            hasUpdate: false,
            currentVersion,
            latestVersion,
            zipUrl: null,
            manifestUrl: null,
            error: `Invalid tag format: ${latestTag} does not start with 'v'`,
            errorType: 'unknown'
        };
    }
    const versionPattern = /^v\d+\.\d+\.\d+$/;
    if (!versionPattern.test(latestTag)) {
        return {
            hasUpdate: false,
            currentVersion,
            latestVersion,
            zipUrl: null,
            manifestUrl: null,
            error: `Invalid tag format: ${latestTag} does not match vX.X.X`,
            errorType: 'unknown'
        };
    }
    if (zipUrl) {
        const zipFileName = zipUrl.split('/').pop() || '';
        // Match new format [匹配新格式]
        const fileNamePattern = /^sparklet-v\d+\.\d+\.\d+-win-x86_64\.zip$/;
        if (!fileNamePattern.test(zipFileName)) {
            return {
                hasUpdate: false,
                currentVersion,
                latestVersion,
                zipUrl: null,
                manifestUrl: null,
                error: `Invalid zip filename: ${zipFileName}`,
                errorType: 'unknown'
            };
        }
    }
    else {
        console.log('[UpdateCheck] No update package found, treating as no update');
        return {
            hasUpdate: false,
            currentVersion,
            latestVersion,
            zipUrl: null,
            manifestUrl: null,
            error: null,
            errorType: null
        };
    }
    if (!manifestUrl) {
        return {
            hasUpdate: false,
            currentVersion,
            latestVersion,
            zipUrl: null,
            manifestUrl: null,
            error: 'manifest.releases.json not found',
            errorType: 'unknown'
        };
    }
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
    console.log('[UpdateCheck] Latest version:', latestVersion, 'Has update:', hasUpdate);
    return {
        hasUpdate,
        currentVersion,
        latestVersion,
        zipUrl,
        manifestUrl,
        error: null,
        errorType: null
    };
}
//# sourceMappingURL=check.js.map