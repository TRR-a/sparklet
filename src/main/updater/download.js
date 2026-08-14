"use strict";
// Download management: download with progress and retry [下载管理：带进度和重试的下载]
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
exports.downloadFile = downloadFile;
exports.downloadWithRetry = downloadWithRetry;
const https = __importStar(require("https"));
const fs = __importStar(require("fs-extra"));
const url_1 = require("url");
const constants_1 = require("./constants");
/**
 * Download a file with progress reporting [下载文件，带进度报告]
 * @param url Download URL [下载地址]
 * @param destPath Destination file path [目标文件路径]
 * @param onProgress Optional progress callback (0-100) [可选的进度回调 (0-100)]
 */
function downloadFile(url, destPath, onProgress = null) {
    return new Promise((resolve) => {
        const urlObj = new url_1.URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'GET',
            headers: { 'User-Agent': 'Sparklet-Updater' },
            timeout: constants_1.DOWNLOAD_TIMEOUT_MS
        };
        const req = https.get(options, (res) => {
            if (res.statusCode !== 200) {
                const errMsg = `Download failed, status: ${res.statusCode}`;
                resolve({
                    success: false,
                    error: errMsg,
                    errorType: (0, constants_1.classifyNetworkError)(errMsg)
                });
                return;
            }
            const totalSize = parseInt(res.headers['content-length'] || '0', 10);
            let downloadedSize = 0;
            let lastEmitTime = Date.now();
            const fileStream = fs.createWriteStream(destPath);
            res.on('data', (chunk) => {
                downloadedSize += chunk.length;
                if (onProgress && totalSize > 0) {
                    const now = Date.now();
                    if (now - lastEmitTime > 200) {
                        const percent = Math.round((downloadedSize / totalSize) * 100);
                        onProgress(Math.min(percent, 100));
                        lastEmitTime = now;
                    }
                }
            });
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                if (onProgress)
                    onProgress(100);
                resolve({ success: true, error: null, errorType: null });
            });
            fileStream.on('error', (err) => {
                fs.remove(destPath).catch(() => { });
                const errMsg = `Write error: ${err.message}`;
                resolve({
                    success: false,
                    error: errMsg,
                    errorType: (0, constants_1.classifyNetworkError)(errMsg)
                });
            });
        });
        req.on('error', (err) => {
            fs.remove(destPath).catch(() => { });
            const errMsg = `Network error: ${err.message}`;
            resolve({
                success: false,
                error: errMsg,
                errorType: (0, constants_1.classifyNetworkError)(errMsg)
            });
        });
        req.on('timeout', () => {
            req.destroy();
            fs.remove(destPath).catch(() => { });
            const errMsg = 'Download timeout';
            resolve({
                success: false,
                error: errMsg,
                errorType: (0, constants_1.classifyNetworkError)(errMsg)
            });
        });
    });
}
/**
 * Download with retry on failure [下载失败时自动重试]
 * @param url Download URL [下载地址]
 * @param destPath Destination file path [目标文件路径]
 * @param onProgress Optional progress callback [可选的进度回调]
 * @param retries Max retry count (default MAX_RETRY_COUNT) [最大重试次数 (默认 MAX_RETRY_COUNT)]
 */
async function downloadWithRetry(url, destPath, onProgress = null, retries = constants_1.MAX_RETRY_COUNT) {
    let lastError = null;
    let lastErrorType = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
        console.log(`[Download] Attempt ${attempt}/${retries}: ${url}`);
        const result = await downloadFile(url, destPath, onProgress);
        if (result.success) {
            console.log('[Download] Download succeeded');
            return { success: true, error: null, errorType: null };
        }
        lastError = result.error;
        lastErrorType = result.errorType || (0, constants_1.classifyNetworkError)(result.error);
        console.warn(`[Download] Failed (${attempt}/${retries}):`, lastError, `type=${lastErrorType}`);
        if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, constants_1.RETRY_DELAY_MS));
        }
    }
    return {
        success: false,
        error: `Download failed after ${retries} attempts: ${lastError}`,
        errorType: lastErrorType || 'unknown'
    };
}
//# sourceMappingURL=download.js.map