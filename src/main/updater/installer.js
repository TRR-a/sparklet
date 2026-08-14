"use strict";
// Installer: always dispatch external updater (directReplace removed: asar archives are read-only and cannot be patched in-place inside a running app; all updates apply after main quits) [安装器：始终调度外部更新器 (directReplace 已移除：asar 归档是只读的，无法在运行中的应用内原地打补丁；所有更新在主进程退出后应用)]
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
exports.runExternalUpdater = runExternalUpdater;
exports.installUpdate = installUpdate;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const constants_1 = require("./constants");
/**
 * Run external updater process [运行外部更新器进程]
 * @param zipPath Update package zip path [更新包 zip 路径]
 * @param tempDir Temp directory path [临时目录路径]
 * @param targetVersion Target version string [目标版本号]
 * @returns Install result [安装结果]
 */
async function runExternalUpdater(zipPath, tempDir, targetVersion) {
    const updaterScript = (0, constants_1.getUpdaterScriptPath)();
    const exists = await fs.pathExists(updaterScript);
    if (!exists) {
        console.error('[Installer] Updater script not found:', updaterScript);
        return { success: false, error: `Updater script not found: ${updaterScript}` };
    }
    // Prepare persistent log location (inside userData so user can find it easily) [准备持久化日志位置 (放在 userData 内，方便用户查找)]
    const logDir = path.join(electron_1.app.getPath('userData'), 'update_logs');
    await fs.ensureDir(logDir);
    const ts = new Date();
    const tsStr = ts.getFullYear().toString()
        + String(ts.getMonth() + 1).padStart(2, '0')
        + String(ts.getDate()).padStart(2, '0') + '-'
        + String(ts.getHours()).padStart(2, '0')
        + String(ts.getMinutes()).padStart(2, '0')
        + String(ts.getSeconds()).padStart(2, '0');
    const safeVersion = (targetVersion || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
    const logFile = path.join(logDir, `updater-${safeVersion}-${tsStr}.log`);
    console.log('[Installer] Updater log will be written to:', logFile);
    console.log('[Installer] Starting external updater:', updaterScript);
    return new Promise((resolve) => {
        // ELECTRON_RUN_AS_NODE=1 lets the packaged Electron exe run js files in pure Node mode [ELECTRON_RUN_AS_NODE=1 让 Electron 打包后的 exe 以纯 Node 模式运行 js 文件]
        const nodeProcess = (0, child_process_1.spawn)(process.execPath, [
            updaterScript,
            '--zip', zipPath,
            '--temp', tempDir,
            '--version', targetVersion,
            '--pid', String(process.pid),
            '--log-file', logFile
        ], {
            env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
            cwd: path.dirname(process.execPath)
        });
        nodeProcess.unref();
        setTimeout(() => {
            console.log('[Installer] External updater started, main process will exit');
            resolve({ success: true, error: null, logFile });
        }, 1000);
    });
}
/**
 * Install update (always uses external updater, asar-safe) [安装更新 (始终使用外部更新器，asar 安全)]
 * @param zipPath Update package zip path [更新包 zip 路径]
 * @param tempDir Temp directory path [临时目录路径]
 * @param targetVersion Target version string [目标版本号]
 * @param onProgress Optional progress callback [可选的进度回调]
 * @returns Install result [安装结果]
 */
async function installUpdate(zipPath, tempDir, targetVersion, onProgress = null) {
    onProgress && onProgress('Starting external updater...', 50);
    console.log('[Installer] Package analysis skipped, always using external updater (asar-safe)');
    return runExternalUpdater(zipPath, tempDir, targetVersion);
}
//# sourceMappingURL=installer.js.map