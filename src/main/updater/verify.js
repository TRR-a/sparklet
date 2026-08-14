"use strict";
// Two-layer verification: manifest integrity + SHA256 [双层校验：清单完整性 + SHA256]
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
exports.normalizeVersion = normalizeVersion;
exports.computeSha256 = computeSha256;
exports.getHashField = getHashField;
exports.verifyReleaseManifest = verifyReleaseManifest;
exports.verifyPackageIntegrity = verifyPackageIntegrity;
exports.selfCheckIntegrity = selfCheckIntegrity;
exports.verifyInstalledFiles = verifyInstalledFiles;
exports.collectAllFiles = collectAllFiles;
exports.computeCombinedHash = computeCombinedHash;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const manifest_helper_1 = require("./manifest-helper");
const constants_1 = require("./constants");
const electron_1 = require("electron");
const config_manager_1 = require("./config-manager");
/**
 * Normalize version string: strip 'v' prefix before comparison [规范化版本号：统一去掉 v 前缀后再比较]
 */
function normalizeVersion(v) {
    if (!v)
        return '';
    return String(v).replace(/^v/i, '').trim();
}
/**
 * Compute SHA256 hash of a file [计算文件的 SHA256 哈希]
 */
async function computeSha256(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}
/**
 * Extract a specific hash field from manifest entry. [从 entry 中提取指定 hash 字段。]
 * Semantic isolation principle: different hash fields have different semantics, cross-field fallback is forbidden to avoid false positives. [语义隔离原则：不同 hash 字段语义不同，禁止跨字段兜底导致 100% 误报。]
 *
 * Three verification scenarios: [三校验场景：]
 *   - packageHash: ZIP package integrity (verified after download) ← can fallback to legacy hash field (old versions stored ZIP hash there) [packageHash：ZIP 安装包完整性 (下载后校验) ← 可以 fallback 到旧 hash 字段 (老版本 hash 存的就是 ZIP hash)]
 *   - exeHash: Sparklet.exe integrity (startup self-check) ← no fallback, skip if missing [exeHash：Sparklet.exe 完整性 (启动时自检) ← 禁止 fallback，没有就跳过校验]
 *   - filesHash: All extracted files integrity (startup self-check) ← no fallback, skip if missing [filesHash：解压后全部文件完整性 (启动时自检) ← 禁止 fallback，没有就跳过校验]
 */
function getHashField(entry, fieldName) {
    if (!entry)
        return null;
    const value = entry[fieldName];
    if (value)
        return value;
    // Only packageHash ↔ legacy entry.hash can fallback to each other (same semantics, both ZIP-level / old single hash) [只有 packageHash ↔ 旧 entry.hash 可以互相兜底 (语义一致，都是 ZIP 级别 / 老版本单一 hash)]
    if (fieldName === 'packageHash')
        return entry.hash || null;
    // filesHash and exeHash must NOT fallback to entry.hash (99% of the time entry.hash stores packageHash/ZIP hash) [filesHash 和 exeHash 不允许 fallback 到 entry.hash (99% 情况下 entry.hash 存的是 packageHash/ZIP 的 hash)]
    // Otherwise comparing ZIP hash with "all extracted files combined hash" or "single exe hash" would never match → false positive every startup [否则会把 ZIP 的 hash 拿去和「解压后全部文件组合 hash」或「单 exe hash」比较，必然不相等 → 每次启动误报]
    return null;
}
/**
 * Layer 1 verification: fetch target version info from manifest.releases.json [第一层校验：从 manifest.releases.json 获取目标版本的完整信息]
 */
async function verifyReleaseManifest(manifestUrl, targetVersion) {
    console.log('[Verify] Layer 1: Fetching manifest.releases.json');
    const releases = await (0, manifest_helper_1.fetchReleasesManifest)(manifestUrl);
    if (!releases) {
        return { success: false, error: 'Unable to fetch manifest.releases.json', entry: null };
    }
    const targetEntry = releases.find(item => normalizeVersion(item.version) === normalizeVersion(targetVersion));
    if (!targetEntry) {
        return {
            success: false,
            error: `Version ${targetVersion} not found in manifest`,
            entry: null
        };
    }
    const hasAnyHash = targetEntry.packageHash || targetEntry.exeHash || targetEntry.filesHash || targetEntry.hash;
    if (!hasAnyHash) {
        return {
            success: false,
            error: `Version ${targetVersion} manifest entry missing all hash fields`,
            entry: null
        };
    }
    console.log('[Verify] Layer 1 passed, entry:', {
        version: targetEntry.version,
        packageHash: targetEntry.packageHash ? targetEntry.packageHash.slice(0, 16) + '...' : (targetEntry.hash ? targetEntry.hash.slice(0, 16) + '...' : 'missing'),
        internalCodename: targetEntry.internalCodename || 'N/A'
    });
    return { success: true, entry: targetEntry, error: null };
}
/**
 * Layer 2 verification: verify downloaded package SHA256 matches expected hash [第二层校验：验证下载的更新包 SHA256 是否与预期一致]
 * Uses entry.packageHash first, falls back to entry.hash [优先用 entry.packageHash，回退到 entry.hash]
 */
async function verifyPackageIntegrity(zipPath, entry) {
    const expectedHash = getHashField(entry, 'packageHash');
    console.log('[Verify] Layer 2: Computing SHA256 of downloaded package');
    try {
        if (!expectedHash) {
            console.warn('[Verify] packageHash missing, skipping package integrity check');
            return { success: true, error: null };
        }
        const exists = await fs.pathExists(zipPath);
        if (!exists) {
            return { success: false, error: 'Downloaded package file not found' };
        }
        const actualHash = await computeSha256(zipPath);
        console.log('[Verify] Actual package hash:', actualHash.slice(0, 16) + '...');
        console.log('[Verify] Expected package hash:', expectedHash.slice(0, 16) + '...');
        if (actualHash !== expectedHash) {
            return {
                success: false,
                error: `Package SHA256 mismatch: expected ${expectedHash}, got ${actualHash}`,
                errorType: 'unknown'
            };
        }
        console.log('[Verify] Layer 2 passed');
        return { success: true, error: null };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: `Verification error: ${msg}` };
    }
}
/**
 * Startup integrity self-check: verify the running exe has not been tampered with [启动时完整性自检：校验当前运行的 exe 文件是否被篡改]
 * Uses external manifest.current.json (same directory as exe) [使用外挂的 manifest.current.json (与 exe 同目录)]
 * Uses exeHash first, falls back to hash [优先用 exeHash，回退到 hash]
 */
async function selfCheckIntegrity() {
    console.log('[Verify] Running startup integrity self-check');
    if (!electron_1.app.isPackaged) {
        console.log('[Verify] Development environment, skipping self-check');
        return { success: true, error: null };
    }
    const exeDir = path.dirname(process.execPath);
    const appRoot = (0, constants_1.getAppRoot)();
    // Prefer reading from exe directory (user install dir), then from appRoot (where installer writes) [优先读 exe 目录 (用户安装目录)，其次读 appRoot (installer 写入的位置)]
    const candidatePaths = [
        path.join(exeDir, 'manifest.current.json'),
        path.join(appRoot, 'manifest.current.json')
    ];
    let currentManifest = null;
    for (const manifestPath of candidatePaths) {
        try {
            const exists = await fs.pathExists(manifestPath);
            if (!exists)
                continue;
            const content = await fs.readFile(manifestPath, 'utf-8');
            currentManifest = JSON.parse(content);
            console.log('[Verify] Loaded manifest.current.json from:', manifestPath);
            break;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn('[Verify] Failed to read manifest.current.json at', manifestPath, ':', msg);
        }
    }
    if (!currentManifest) {
        console.warn('[Verify] manifest.current.json not found, skipping self-check');
        return { success: true, error: null };
    }
    const expectedExeHash = getHashField(currentManifest, 'exeHash');
    if (!expectedExeHash) {
        console.warn('[Verify] manifest.current.json missing exeHash/hash field, skipping self-check');
        return { success: true, error: null };
    }
    try {
        const currentExePath = process.execPath;
        const exists = await fs.pathExists(currentExePath);
        if (!exists) {
            console.warn('[Verify] Current exe file not found, skipping self-check');
            return { success: true, error: null };
        }
        const actualHash = await computeSha256(currentExePath);
        if (actualHash !== expectedExeHash) {
            return {
                success: false,
                error: `Integrity check failed: executable file hash mismatch`
            };
        }
        console.log('[Verify] Integrity self-check passed');
        return { success: true, error: null };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Verify] Self-check error:', msg);
        return { success: true, error: null };
    }
}
/**
 * Verify installed files integrity (called on startup) [校验已安装的文件完整性 (启动时调用)]
 * Enabled by default, scans all files under appRoot (excluding manifest file blacklist) [默认启用，扫描 appRoot 全目录下所有文件 (排除 manifest 文件黑名单)]
 * Uses filesHash first, falls back to hash (legacy format compatible) [优先用 filesHash，回退到 hash (兼容旧格式)]
 * Data source priority: cloud manifest.releases.json → local manifest.current.json → skip [数据源优先级：云端 manifest.releases.json → 本地 manifest.current.json → 跳过]
 */
async function verifyInstalledFiles(currentVersion, onProgress = null) {
    const errors = [];
    // Use install root (exe directory) as scan root, consistent with packaging side --files win-unpacked/ scope [用安装根目录 (exe 所在目录) 做扫描根，和打包端 --files win-unpacked/ 范围一致]
    const appRoot = (0, constants_1.getInstallRoot)();
    // Skip check in development environment [开发环境跳过校验]
    if (!electron_1.app.isPackaged) {
        console.log('[Verify] Development environment, skipping installed files check');
        return { success: true, errors: [] };
    }
    // Read config, check if integrity check is enabled [读取配置，检查是否启用完整性校验]
    try {
        const enabled = await (0, config_manager_1.getConfigItem)('integrityCheck');
        if (enabled === false) {
            console.log('[Verify] Integrity check disabled by user');
            return { success: true, errors: [] };
        }
    }
    catch (err) {
        console.log('[Verify] Config read failed, using default (enabled)');
    }
    onProgress && onProgress('正在校验应用文件完整性...', 0);
    // Get expected filesHash (cloud first, local fallback) [获取预期的 filesHash (云端优先，本地兜底)]
    let expectedFilesHash = null;
    let hashSource = null;
    try {
        const manifestUrl = `https://github.com/TRR-a/sparklet/releases/download/v${currentVersion}/manifest.releases.json`;
        const releases = await (0, manifest_helper_1.fetchReleasesManifest)(manifestUrl);
        if (releases && Array.isArray(releases)) {
            const targetEntry = releases.find(item => normalizeVersion(item.version) === normalizeVersion(currentVersion));
            const fHash = getHashField(targetEntry, 'filesHash');
            if (fHash) {
                expectedFilesHash = fHash;
                hashSource = 'cloud';
                console.log('[Verify] Using cloud manifest for files integrity check');
            }
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log('[Verify] Cloud manifest fetch failed:', msg);
    }
    if (!expectedFilesHash) {
        try {
            const localManifest = await (0, manifest_helper_1.readCurrentManifest)();
            const fHash = getHashField(localManifest, 'filesHash');
            if (fHash) {
                expectedFilesHash = fHash;
                hashSource = 'local';
                console.log('[Verify] Using local manifest for files integrity check');
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.log('[Verify] Local manifest read failed:', msg);
        }
    }
    if (!expectedFilesHash) {
        console.warn('[Verify] No filesHash source available, skipping installed files check');
        return { success: true, errors: [] };
    }
    onProgress && onProgress('正在计算文件哈希...', 30);
    try {
        const exists = await fs.pathExists(appRoot);
        if (!exists) {
            errors.push(`应用根目录不存在: ${appRoot}`);
            return { success: false, errors };
        }
        const files = [];
        await collectAllFiles(appRoot, files);
        if (files.length === 0) {
            errors.push('未找到任何应用文件');
            return { success: false, errors };
        }
        onProgress && onProgress(`正在校验 ${files.length} 个文件...`, 60);
        const combinedHash = await computeCombinedHash(files);
        if (combinedHash !== expectedFilesHash) {
            errors.push(`文件完整性校验失败: 期望 ${expectedFilesHash.slice(0, 16)}...，实际 ${combinedHash.slice(0, 16)}...`);
            return { success: false, errors };
        }
        onProgress && onProgress('✅ 文件完整性校验通过', 100);
        console.log('[Verify] Installed files integrity check passed (source:', hashSource, ',', files.length, 'files)');
        return { success: true, errors: [] };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Verify] Integrity check error:', msg);
        errors.push(`校验过程出错: ${msg}`);
        return { success: false, errors };
    }
}
/**
 * Recursively collect all files in a directory (excluding exact filename blacklist + extension blacklist) [递归收集目录下所有文件 (排除精确文件名黑名单 + 扩展名黑名单)]
 * Both generation side and runtime use isExcludedFromIntegrity for filtering, ensuring consistent rules [生成端和运行端统一用 isExcludedFromIntegrity 过滤，保证规则一致]
 */
async function collectAllFiles(dir, fileList) {
    const items = await fs.readdir(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
            await collectAllFiles(fullPath, fileList);
        }
        else {
            // Dual filter by exact filename + extension (.log/.dmp/.tmp etc. excluded from hash) [精确文件名 + 扩展名双重过滤 (.log/.dmp/.tmp 等临时/崩溃文件一律不参与 hash)]
            if ((0, constants_1.isExcludedFromIntegrity)(item)) {
                continue;
            }
            fileList.push(fullPath);
        }
    }
}
/**
 * Compute combined hash of multiple files (sort by path, concatenate content, then SHA256) [计算多个文件的组合哈希 (按路径排序后拼接内容，再算 SHA256)]
 */
async function computeCombinedHash(filePaths) {
    const hash = crypto.createHash('sha256');
    const sorted = filePaths.slice().sort();
    for (const filePath of sorted) {
        const content = await fs.readFile(filePath);
        hash.update(content);
    }
    return hash.digest('hex');
}
//# sourceMappingURL=verify.js.map