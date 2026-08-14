"use strict";
// Manifest file reading and parsing (full object, no field validation) [清单文件读取与解析 (完整对象，不做字段校验)]
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
exports.readCurrentManifest = readCurrentManifest;
exports.fetchReleasesManifest = fetchReleasesManifest;
exports.extractAssetsFromRelease = extractAssetsFromRelease;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
const url_1 = require("url");
const constants_1 = require("./constants");
/**
 * Read the bundled manifest.current.json [读取随应用打包的 manifest.current.json]
 * @returns Full object, or null if file missing/parse failed [完整对象，或 null (文件不存在/解析失败)]
 */
async function readCurrentManifest() {
    const manifestPath = path.join((0, constants_1.getAppRoot)(), 'manifest.current.json');
    try {
        const exists = await fs.pathExists(manifestPath);
        if (!exists) {
            console.warn('[ManifestHelper] manifest.current.json not found');
            return null;
        }
        const content = await fs.readFile(manifestPath, 'utf-8');
        const data = JSON.parse(content);
        // Return full object directly, no field validation [直接返回完整对象，不做字段校验]
        return data;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[ManifestHelper] Read manifest.current.json failed:', msg);
        return null;
    }
}
/**
 * Download manifest.releases.json from GitHub [从 GitHub 下载 manifest.releases.json]
 * @param downloadUrl Asset download URL [附件下载地址]
 * @returns Full object array, or null [完整对象数组，或 null]
 */
async function fetchReleasesManifest(downloadUrl) {
    return new Promise((resolve) => {
        const urlObj = new url_1.URL(downloadUrl);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'GET',
            headers: { 'User-Agent': 'Sparklet-Updater', 'Accept': 'application/json' },
            timeout: 10000
        };
        const req = https.get(options, (res) => {
            if (res.statusCode !== 200) {
                console.error('[ManifestHelper] Fetch manifest failed, status:', res.statusCode);
                resolve(null);
                return;
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (!Array.isArray(parsed) || parsed.length === 0) {
                        console.warn('[ManifestHelper] Invalid manifest format, expecting non-empty array');
                        resolve(null);
                        return;
                    }
                    // Return full array directly, no field validation [直接返回完整数组，不做字段校验]
                    resolve(parsed);
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    console.error('[ManifestHelper] Parse manifest failed:', msg);
                    resolve(null);
                }
            });
        });
        req.on('error', (err) => {
            console.error('[ManifestHelper] Request error:', err.message);
            resolve(null);
        });
        req.on('timeout', () => {
            req.destroy();
            console.error('[ManifestHelper] Request timeout');
            resolve(null);
        });
    });
}
/**
 * Extract asset download URLs from GitHub Release data [从 GitHub Release 数据中提取 asset 下载地址]
 * @param releaseData GitHub API release data [GitHub API 返回的 release 数据]
 * @returns Extraction result with zipUrl, manifestUrl, tagName [提取结果]
 */
function extractAssetsFromRelease(releaseData) {
    if (!releaseData || !releaseData.assets || !Array.isArray(releaseData.assets)) {
        return { zipUrl: null, manifestUrl: null, tagName: null };
    }
    const tagName = releaseData.tag_name || null;
    let zipUrl = null;
    let manifestUrl = null;
    for (const asset of releaseData.assets) {
        const name = asset.name || '';
        if (name === 'manifest.releases.json') {
            manifestUrl = asset.browser_download_url || null;
        }
        else if (name.match(/^sparklet-v\d+\.\d+\.\d+-win-x86_64\.zip$/)) {
            zipUrl = asset.browser_download_url || null;
        }
    }
    return { zipUrl, manifestUrl, tagName };
}
//# sourceMappingURL=manifest-helper.js.map