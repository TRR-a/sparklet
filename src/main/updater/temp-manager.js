"use strict";
// Temp directory management: acquire, clean, release [临时目录管理：获取、清理、释放]
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
exports.cleanDirectory = cleanDirectory;
exports.acquireTempDir = acquireTempDir;
exports.releaseTempDir = releaseTempDir;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const constants_1 = require("./constants");
/**
 * Clean all items in a directory (keep the directory itself) [清理目录内所有条目 (保留目录本身)]
 * @param dirPath Directory path to clean [待清理的目录路径]
 * @returns Whether cleaning succeeded [是否清理成功]
 */
async function cleanDirectory(dirPath) {
    try {
        const exists = await fs.pathExists(dirPath);
        if (!exists)
            return true;
        const items = await fs.readdir(dirPath);
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            await fs.remove(itemPath);
        }
        return true;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[TempManager] Clean directory failed:', dirPath, msg);
        return false;
    }
}
/**
 * Acquire an available temp directory [获取可用的临时目录]
 * Tries each candidate directory in order; if all fail, prompts user to retry or specify manually [按顺序尝试每个候选目录；若全部失败，提示用户重试或手动指定]
 * @returns Temp directory acquire result [临时目录获取结果]
 */
async function acquireTempDir() {
    const tempBase = (0, constants_1.getTempPath)();
    for (const dirName of constants_1.TEMP_DIR_NAMES) {
        const fullPath = path.join(tempBase, dirName);
        try {
            const exists = await fs.pathExists(fullPath);
            if (!exists) {
                await fs.ensureDir(fullPath);
                console.log('[TempManager] Created temp directory:', fullPath);
                return { success: true, path: fullPath, isManual: false };
            }
            else {
                const cleaned = await cleanDirectory(fullPath);
                if (cleaned) {
                    console.log('[TempManager] Reused and cleaned temp directory:', fullPath);
                    return { success: true, path: fullPath, isManual: false };
                }
                console.warn('[TempManager] Clean failed, trying next:', fullPath);
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[TempManager] Access error:', fullPath, msg);
        }
    }
    console.error('[TempManager] All candidate directories unavailable');
    const result = await electron_1.dialog.showMessageBox({
        type: 'warning',
        title: 'Update Temp Directory Error',
        message: 'Unable to create or clean temp directory. Please manually clean Sparklet-* or sparklet-* folders in %TEMP%, or specify an empty directory as update cache.',
        buttons: ['Retry', 'Specify Manually', 'Cancel'],
        defaultId: 0,
        cancelId: 2
    });
    if (result.response === 0) {
        return acquireTempDir();
    }
    else if (result.response === 1) {
        const { canceled, filePaths } = await electron_1.dialog.showOpenDialog({
            title: 'Select Empty Directory as Update Cache',
            properties: ['openDirectory', 'createDirectory']
        });
        if (canceled || filePaths.length === 0) {
            return { success: false, path: null, isManual: false };
        }
        const manualPath = filePaths[0];
        try {
            const items = await fs.readdir(manualPath);
            if (items.length > 0) {
                const confirm = await electron_1.dialog.showMessageBox({
                    type: 'warning',
                    title: 'Directory Not Empty',
                    message: 'Selected directory is not empty. Continue? (It will be cleaned after update)',
                    buttons: ['Continue', 'Reselect'],
                    defaultId: 0,
                    cancelId: 1
                });
                if (confirm.response === 1)
                    return acquireTempDir();
                await cleanDirectory(manualPath);
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[TempManager] Manual dir check failed:', msg);
            return { success: false, path: null, isManual: false };
        }
        console.log('[TempManager] Using manually specified temp directory:', manualPath);
        return { success: true, path: manualPath, isManual: true };
    }
    else {
        return { success: false, path: null, isManual: false };
    }
}
/**
 * Release a temp directory (clean or remove based on acquisition mode) [释放临时目录 (根据获取方式清理或删除)]
 * @param dirPath Directory path to release [待释放的目录路径]
 * @param isManual Whether the directory was manually specified [是否为手动指定的目录]
 */
async function releaseTempDir(dirPath, isManual = false) {
    if (!dirPath)
        return;
    try {
        if (isManual) {
            await fs.remove(dirPath);
            console.log('[TempManager] Removed manual temp directory:', dirPath);
        }
        else {
            await cleanDirectory(dirPath);
            console.log('[TempManager] Cleaned temp directory:', dirPath);
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[TempManager] Release failed:', dirPath, msg);
    }
}
//# sourceMappingURL=temp-manager.js.map