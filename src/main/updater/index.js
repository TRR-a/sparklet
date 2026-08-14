"use strict";
// Update module entry point [更新模块入口]
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
exports.updaterState = void 0;
exports.initUpdater = initUpdater;
exports.checkUpdateManually = checkUpdateManually;
exports.checkPendingUpdate = checkPendingUpdate;
exports.performUpdate = performUpdate;
exports.broadcastToast = broadcastToast;
exports.applyDevConfigOverride = applyDevConfigOverride;
exports.checkDisableFlags = checkDisableFlags;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const electron_2 = require("electron");
const constants_1 = require("./constants");
const temp_manager_1 = require("./temp-manager");
const check_1 = require("./check");
const download_1 = require("./download");
const verify_1 = require("./verify");
const installer_1 = require("./installer");
const config_manager_1 = require("./config-manager");
const cacheManager = __importStar(require("./cache-manager"));
// Update state [更新状态]
let isUpdating = false;
let pendingUpdate = null;
let updateDisabled = false;
let checkTimer = null;
let isChecking = false;
/**
 * Map<dialogId, { resolve, timer, fallback }> Renderer responds to user action via ipcMain.handle('updater:dialog-response') [Map<dialogId, { resolve, timer, fallback }> 渲染层响应用户操作后通过 ipcMain.handle('updater:dialog-response') 回传]
 */
const pendingDialogResponses = new Map();
let dialogIdSeq = 0;
/**
 * Find an available BrowserWindow (prefer focused window, then any window) [找一个可用的 BrowserWindow (优先聚焦窗口，其次任意窗口)]
 */
function findAvailableWindow() {
    const focused = electron_1.BrowserWindow.getFocusedWindow();
    if (focused && !focused.isDestroyed())
        return focused;
    const all = electron_1.BrowserWindow.getAllWindows().filter(w => !w.isDestroyed());
    return all.length > 0 ? all[0] : null;
}
/**
 * Show custom UI dialog via renderer (i18n friendly, unified style) [通过渲染层弹自定义 UI 对话框 (i18n 友好，统一风格)]
 * @param dialogType Dialog type: update-confirm / notify-only / restart-confirm / rollback-with-cache / rollback-restart / rollback-no-cache / manual-update-failed / simple-error [弹窗类型]
 * @param params Params passed to renderer for display (version / codename / errors etc.) [传给渲染层用于显示的参数 (version / codename / errors 等)]
 * @param options Dialog options [弹窗选项]
 * @param options.timeoutMs Timeout duration, auto-returns fallbackResponse when reached [超时时间，到了自动返回 fallbackResponse]
 * @param options.fallbackResponse Return value on timeout (usually button index) [超时时的返回值 (一般是按钮 index)]
 * @param options.fallbackToSystemDialog Whether to use system dialog as fallback when no window found [找不到窗口时是否用系统 dialog 兜底]
 * @returns User's selection result (usually { buttonIndex: number }) [用户选择的结果 (通常是 { buttonIndex: number })]
 */
async function promptRendererDialog(dialogType, params = {}, options = {}) {
    const { timeoutMs = 0, fallbackResponse = { buttonIndex: 1 }, fallbackToSystemDialog = true } = options;
    const win = findAvailableWindow();
    // No available window: fall back to system dialog [没有可用窗口：走系统 dialog 兜底]
    if (!win) {
        if (!fallbackToSystemDialog)
            return fallbackResponse;
        console.warn('[Updater] No renderer window available, falling back to system dialog for type=' + dialogType);
        return systemDialogFallback(dialogType, params);
    }
    const dialogId = `dlg_${Date.now()}_${(++dialogIdSeq)}`;
    const payload = { dialogId, dialogType, params, timeoutMs };
    return new Promise((resolve) => {
        let timer = null;
        if (timeoutMs > 0) {
            timer = setTimeout(() => {
                if (pendingDialogResponses.has(dialogId)) {
                    console.log('[Updater] Dialog timeout, returning fallback:', dialogType);
                    pendingDialogResponses.delete(dialogId);
                    resolve(fallbackResponse);
                }
            }, timeoutMs);
        }
        pendingDialogResponses.set(dialogId, { resolve, timer });
        console.log(`[Updater] Sending renderer dialog: ${dialogType} id=${dialogId}`);
        win.webContents.send('updater:dialog-show', payload);
    });
}
/**
 * System dialog fallback (only used when no window found or renderer doesn't respond, hardcodes English to avoid garbled text) Normally doesn't trigger, this is just basic fallback, no i18n guarantee [系统 dialog 兜底 (找不到窗口或渲染层不响应时才用，硬编码英文避免乱码) 一般情况下不触发，这里只做最基本保底，不保证 i18n]
 */
function systemDialogFallback(dialogType, params) {
    const title = `Sparklet Update - ${dialogType}`;
    const detail = Object.entries(params || {})
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
        .join('\n');
    if (dialogType === 'rollback-no-cache' || dialogType === 'rollback-with-cache' || dialogType === 'manual-update-failed' || dialogType === 'simple-error') {
        return electron_1.dialog.showMessageBox({
            type: 'error', title, message: title, detail,
            buttons: ['OK'], defaultId: 0
        }).then(r => ({ buttonIndex: r.response }));
    }
    return electron_1.dialog.showMessageBox({
        type: 'info', title, message: title, detail,
        buttons: ['OK'], defaultId: 0
    }).then(r => ({ buttonIndex: r.response }));
}
/**
 * Renderer response handler: updater:dialog-response Register once during initUpdater (prevent duplicate registration) [渲染层回传响应：updater:dialog-response 在 initUpdater 时注册一次 handle (防止重复注册)]
 */
let dialogResponseHandlerRegistered = false;
function ensureDialogResponseHandler() {
    if (dialogResponseHandlerRegistered)
        return;
    dialogResponseHandlerRegistered = true;
    electron_1.ipcMain.handle('updater:dialog-response', (_event, { dialogId, response }) => {
        const entry = pendingDialogResponses.get(dialogId);
        if (!entry) {
            console.warn('[Updater] Received dialog-response for unknown/expired id:', dialogId);
            return { ok: false, reason: 'unknown-dialog-id' };
        }
        pendingDialogResponses.delete(dialogId);
        if (entry.timer)
            clearTimeout(entry.timer);
        console.log(`[Updater] Dialog response received: id=${dialogId}, response=`, response);
        entry.resolve(response);
        return { ok: true };
    });
}
function checkDisableFlags() {
    const args = process.argv;
    updateDisabled = constants_1.DISABLE_UPDATE_FLAGS.some(flag => args.includes(flag));
    if (updateDisabled) {
        console.log('[Updater] Update disabled via command line flag');
    }
    return updateDisabled;
}
/**
 * Format date for display [格式化日期显示]
 */
function formatDate(isoString) {
    if (!isoString)
        return '未知';
    try {
        const date = new Date(isoString);
        return date.toISOString().split('T')[0];
    }
    catch {
        return String(isoString);
    }
}
/**
 * Show "new version found" dialog (renderer custom UI, i18n friendly) [显示「发现新版本」对话框 (渲染层自定义 UI，i18n 友好)]
 * @returns 0=update now, 1=later [0=立即更新, 1=稍后]
 */
async function showUpdateDialog(currentVersion, entry) {
    const version = entry.version || `v${currentVersion}`;
    const codename = entry.internalCodename || 'N/A';
    const releaseDate = formatDate(entry.releaseDate);
    const pkgHash = entry.packageHash || entry.hash;
    const hashPrefix = pkgHash ? pkgHash.slice(0, 6) : '';
    return promptRendererDialog('update-confirm', {
        newVersion: version,
        codename,
        releaseDate,
        hashPrefix,
        currentVersion: `v${currentVersion}`
    });
}
/**
 * Show "notify-only" mode notification (renderer custom UI) [显示「仅提醒」模式的通知 (渲染层自定义 UI)]
 */
async function showNotifyOnlyDialog(currentVersion, entry, releaseUrl) {
    const version = entry.version || `v${currentVersion}`;
    const codename = entry.internalCodename || 'N/A';
    const releaseDate = formatDate(entry.releaseDate);
    return promptRendererDialog('notify-only', {
        newVersion: version,
        codename,
        releaseDate,
        releaseUrl
    });
}
/**
 * Show "restart confirmation" dialog (30s timeout auto-selects "later") [显示「重启确认」对话框 (30s 超时自动选「稍后」)]
 * @returns 0=restart now, 1=later [0=立即重启, 1=稍后]
 */
async function showRestartDialog(targetVersion, entry) {
    const version = entry.version || `v${targetVersion}`;
    const codename = entry.internalCodename || 'N/A';
    const releaseDate = formatDate(entry.releaseDate);
    const response = await promptRendererDialog('restart-confirm', {
        targetVersion: version,
        codename,
        releaseDate
    }, {
        timeoutMs: 30000,
        fallbackResponse: { buttonIndex: 1, timedOut: true }
    });
    return response;
}
/**
 * Execute the complete update flow [执行完整的更新流程]
 */
async function performUpdate(onProgress, onComplete) {
    if (isUpdating) {
        console.warn('[Updater] Update already in progress');
        onComplete && onComplete(false, 'Update already in progress');
        return;
    }
    isUpdating = true;
    let tempDir = null;
    let isManualDir = false;
    let zipPath = null;
    try {
        if (updateDisabled) {
            console.log('[Updater] Update disabled, skipping');
            onComplete && onComplete(false, 'Update disabled');
            isUpdating = false;
            return;
        }
        const updateBehavior = await (0, config_manager_1.getUpdateBehavior)();
        if (updateBehavior === 'disabled') {
            console.log('[Updater] User disabled updates');
            onComplete && onComplete(true, null);
            isUpdating = false;
            return;
        }
        onProgress && onProgress('Checking version...', 0);
        const checkResult = await (0, check_1.checkForUpdates)();
        if (checkResult.error) {
            console.error('[Updater] Version check failed:', checkResult.error);
            const friendly = formatFriendlyUpdateError(checkResult.error, checkResult.errorType, 'check');
            onComplete && onComplete(false, checkResult.error, friendly);
            isUpdating = false;
            return;
        }
        if (!checkResult.hasUpdate) {
            console.log('[Updater] Already up to date');
            onComplete && onComplete(true, null);
            isUpdating = false;
            await (0, config_manager_1.setConfigItem)('lastCheckTime', new Date().toISOString());
            return;
        }
        const { currentVersion, latestVersion, zipUrl, manifestUrl } = checkResult;
        console.log('[Updater] New version found:', latestVersion);
        if (updateBehavior === 'notify-only') {
            const releaseUrl = `https://github.com/TRR-a/sparklet/releases/tag/v${latestVersion}`;
            const manifestResult = await (0, verify_1.verifyReleaseManifest)(manifestUrl, `v${latestVersion}`);
            if (manifestResult.success && manifestResult.entry) {
                await showNotifyOnlyDialog(currentVersion, manifestResult.entry, releaseUrl);
            }
            else {
                await promptRendererDialog('notify-only', {
                    newVersion: `v${latestVersion}`,
                    codename: 'N/A',
                    releaseDate: 'N/A',
                    releaseUrl
                });
            }
            await (0, config_manager_1.setConfigItem)('lastCheckTime', new Date().toISOString());
            onComplete && onComplete(true, null);
            isUpdating = false;
            return;
        }
        onProgress && onProgress('Fetching update metadata...', 3);
        const manifestResult = await (0, verify_1.verifyReleaseManifest)(manifestUrl, `v${latestVersion}`);
        if (!manifestResult.success) {
            const friendly = formatFriendlyUpdateError(manifestResult.error, null, 'download-manifest');
            onComplete && onComplete(false, manifestResult.error, friendly);
            isUpdating = false;
            return;
        }
        const entry = manifestResult.entry;
        const confirmResult = await showUpdateDialog(currentVersion, entry);
        const userConfirmed = confirmResult.buttonIndex === 0;
        if (!userConfirmed) {
            console.log('[Updater] User cancelled update');
            onComplete && onComplete(true, null);
            isUpdating = false;
            return;
        }
        onProgress && onProgress('Preparing temp directory...', 5);
        const tempResult = await (0, temp_manager_1.acquireTempDir)();
        if (!tempResult.success) {
            onComplete && onComplete(false, 'Unable to acquire temp directory');
            isUpdating = false;
            return;
        }
        tempDir = tempResult.path;
        isManualDir = tempResult.isManual;
        console.log('[Updater] Using temp directory:', tempDir);
        onProgress && onProgress('Downloading update package...', 10);
        const zipFileName = `sparklet-v${latestVersion}-win-x86_64.zip`;
        zipPath = path.join(tempDir, zipFileName);
        const downloadResult = await (0, download_1.downloadWithRetry)(zipUrl, zipPath, (percent) => {
            const progress = 10 + Math.round(percent * 0.5);
            onProgress && onProgress(`Downloading... ${percent}%`, progress);
        }, constants_1.MAX_RETRY_COUNT);
        if (!downloadResult.success) {
            await (0, temp_manager_1.releaseTempDir)(tempDir, isManualDir);
            const friendly = formatFriendlyUpdateError(downloadResult.error, downloadResult.errorType, 'download-zip');
            onComplete && onComplete(false, downloadResult.error, friendly);
            isUpdating = false;
            return;
        }
        onProgress && onProgress('Verifying file integrity...', 80);
        const integrityResult = await (0, verify_1.verifyPackageIntegrity)(zipPath, entry);
        if (!integrityResult.success) {
            await fs.remove(zipPath).catch(() => { });
            await (0, temp_manager_1.releaseTempDir)(tempDir, isManualDir);
            const friendly = formatFriendlyUpdateError(integrityResult.error, integrityResult.errorType, 'verify');
            onComplete && onComplete(false, integrityResult.error, friendly);
            isUpdating = false;
            return;
        }
        // ========== Sync downloaded ZIP to persistent cache (for rollback/reinstall) ========== [同步下载好的 ZIP 到持久缓存 (供回滚/重装使用)]
        onProgress && onProgress('Syncing to persistent cache...', 85);
        try {
            const versionWithV = `v${latestVersion}`;
            const packageHash = entry.packageHash || entry.hash || null;
            await cacheManager.registerCachedZip(zipPath, versionWithV, packageHash);
        }
        catch (err) {
            // Cache write failure doesn't affect main flow, log and continue [缓存写入失败不影响主流程，打个日志继续]
            const msg = err instanceof Error ? err.message : String(err);
            console.warn('[Updater] Failed to cache update zip (non-critical):', msg);
        }
        onProgress && onProgress('Ready to install...', 90);
        const restartResult = await showRestartDialog(latestVersion, entry);
        const restartConfirmed = restartResult.buttonIndex === 0;
        const laterConfirmed = restartResult.buttonIndex === 1;
        const timeoutOccurred = !!restartResult.timedOut;
        if (laterConfirmed) {
            pendingUpdate = { zipPath: zipPath, tempDir: tempDir, isManualDir, targetVersion: latestVersion };
            console.log('[Updater] User chose later, update will be applied on app exit' + (timeoutOccurred ? ' (timeout triggered)' : ''));
            await (0, config_manager_1.setConfigItem)('lastCheckTime', new Date().toISOString());
            onComplete && onComplete(true, null);
            isUpdating = false;
            return;
        }
        // restartConfirmed is implied here [这里隐含 restartConfirmed]
        void restartConfirmed;
        onProgress && onProgress('Installing update...', 95);
        const installResult = await (0, installer_1.installUpdate)(zipPath, tempDir, latestVersion, (msg, pct) => {
            onProgress && onProgress(msg, 95 + Math.round(pct * 0.05));
        });
        if (!installResult.success) {
            await (0, temp_manager_1.releaseTempDir)(tempDir, isManualDir);
            const friendly = formatFriendlyUpdateError(installResult.error, null, 'install');
            onComplete && onComplete(false, installResult.error, friendly);
            isUpdating = false;
            return;
        }
        onProgress && onProgress('Update complete, restarting...', 100);
        pendingUpdate = null;
        isUpdating = false;
        await (0, config_manager_1.setConfigItem)('lastCheckTime', new Date().toISOString());
        setTimeout(() => electron_1.app.quit(), 500);
        onComplete && onComplete(true, null);
    }
    catch (err) {
        const rawErr = err instanceof Error ? err.message : String(err);
        console.error('[Updater] Update process error:', err);
        if (zipPath)
            await fs.remove(zipPath).catch(() => { });
        if (tempDir)
            await (0, temp_manager_1.releaseTempDir)(tempDir, isManualDir);
        isUpdating = false;
        const friendly = formatFriendlyUpdateError(rawErr, null, 'check');
        onComplete && onComplete(false, rawErr, friendly);
    }
}
async function checkPendingUpdate() {
    if (!pendingUpdate)
        return false;
    console.log('[Updater] Pending update detected, applying...');
    const { zipPath, tempDir, isManualDir, targetVersion } = pendingUpdate;
    const result = await (0, installer_1.installUpdate)(zipPath, tempDir, targetVersion);
    if (result.success) {
        pendingUpdate = null;
        setTimeout(() => electron_1.app.quit(), 500);
        return true;
    }
    else {
        console.error('[Updater] Pending update failed:', result.error);
        await (0, temp_manager_1.releaseTempDir)(tempDir, isManualDir);
        pendingUpdate = null;
        return false;
    }
}
/**
 * Broadcast Toast to all windows [向所有窗口发送 Toast (广播)]
 * message supports two formats: [message 支持两种格式：]
 *   - String: display directly (backward compat), won't auto-translate on language switch [字符串：直接显示 (兼容旧代码)，不会随语言切换自动翻译]
 *   - { key: 'i18n.key.path', params?: { foo: 'bar' } }: renderer calls t(key, params) to translate, supports language switch [{ key: 'i18n.key.path', params?: { foo: 'bar' } }：渲染层会调 t(key, params) 翻译，支持语言切换]
 */
function broadcastToast(message, type = 'info', duration = 3000) {
    const windows = electron_1.BrowserWindow.getAllWindows();
    for (const win of windows) {
        if (!win.isDestroyed()) {
            win.webContents.send('toast:show', { message, type, duration });
        }
    }
    const msgForLog = typeof message === 'string' ? message : `i18n:${message?.key}`;
    console.log('[Updater] Toast broadcast: type=' + type + ', duration=' + duration + 'ms, msg=' + msgForLog);
}
/**
 * Convert raw English error from update flow to user-friendly Chinese prompt [把更新流程里的原始英文错误转换成用户能看懂的中文提示]
 * @param errorMsg Original error message [原始错误消息]
 * @param errorType Classification from classifyNetworkError (if omitted, inferred from errorMsg) [classifyNetworkError 返回的分类 (缺省会尝试从 errorMsg 推断)]
 * @param context Which stage the error occurred in, for more precise prompt [发生在哪个阶段，提示更精准]
 */
function formatFriendlyUpdateError(errorMsg, errorType, context = 'check') {
    const type = (errorType && errorType !== 'unknown')
        ? errorType
        : (0, constants_1.classifyNetworkError)(errorMsg);
    const ctxLabel = (() => {
        switch (context) {
            case 'download-zip': return '下载更新包';
            case 'download-manifest': return '获取版本信息';
            case 'verify': return '校验安装包';
            case 'install': return '安装更新';
            case 'check':
            default: return '检查更新';
        }
    })();
    switch (type) {
        case 'offline':
            return `⚠️ ${ctxLabel}失败：当前网络不可用，请检查网络连接（WiFi/网线/代理）后重试`;
        case 'rate-limit':
            return `⚠️ ${ctxLabel}失败：GitHub API 访问频率超限，请 1 小时后再试`;
        case 'server-error':
            return `⚠️ ${ctxLabel}失败：服务器暂时不可用，请稍后重试或去官网手动下载`;
        case 'write-error':
            return `⚠️ ${ctxLabel}失败：写入本地文件失败，请检查磁盘空间或权限后重试`;
        case 'unknown':
        default: {
            // Common business errors: filename mismatch / invalid tag etc., provide fallback Chinese prompt [常见业务错误：文件名不匹配 / tag 不合法等，给兜底中文提示]
            const m = String(errorMsg || '').toLowerCase();
            if (m.includes('invalid tag format'))
                return `⚠️ ${ctxLabel}失败：GitHub Release 版本号格式异常`;
            if (m.includes('invalid zip filename'))
                return `⚠️ ${ctxLabel}失败：更新包文件名格式不匹配`;
            if (m.includes('manifest.releases.json not found'))
                return `⚠️ ${ctxLabel}失败：更新清单文件缺失，请稍后重试`;
            if (m.includes('failed to parse github api'))
                return `⚠️ ${ctxLabel}失败：GitHub 返回数据异常`;
            if (m.includes('unable to acquire temp directory'))
                return `⚠️ ${ctxLabel}失败：无法创建临时目录，请检查权限`;
            if (m.includes('sha256') || m.includes('packagehash') || m.includes('hash mismatch') || m.includes('integrity')) {
                return `⚠️ ${ctxLabel}失败：安装包完整性校验未通过（文件可能损坏），请重新下载`;
            }
            // Completely unknown: add generic fallback [完全未知：带一句通用兜底]
            return `⚠️ ${ctxLabel}失败，请稍后重试或去 GitHub 官网手动下载`;
        }
    }
}
/**
 * Auto check for updates (triggered by timer) [自动检查更新 (由定时器触发)]
 */
async function autoCheckUpdate() {
    if (!electron_1.app.isPackaged) {
        console.log('[Updater] Development environment, auto-update disabled');
        return;
    }
    if (isChecking || isUpdating)
        return;
    if (updateDisabled)
        return;
    const updateBehavior = await (0, config_manager_1.getUpdateBehavior)();
    if (updateBehavior === 'disabled')
        return;
    isChecking = true;
    console.log('[Updater] Auto-checking for updates...');
    await performUpdate((msg, percent) => console.log(`[Updater] Auto-progress: ${msg} (${percent}%)`), (success, error) => {
        if (!success && error) {
            console.warn('[Updater] Auto-check failed:', error);
        }
        isChecking = false;
    });
    isChecking = false;
}
/**
 * Start the update timer [启动定时器]
 */
function startUpdateTimer() {
    if (checkTimer) {
        clearInterval(checkTimer);
        checkTimer = null;
    }
    (0, config_manager_1.getCheckInterval)().then(interval => {
        if (interval === 0) {
            console.log('[Updater] Timer: check on startup only');
            setTimeout(autoCheckUpdate, 5000);
            return;
        }
        console.log('[Updater] Timer started, interval:', interval, 'ms');
        setTimeout(() => {
            autoCheckUpdate();
            checkTimer = setInterval(autoCheckUpdate, interval);
        }, 5000);
    }).catch(err => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Updater] Failed to start timer:', msg);
    });
}
/**
 * Manually trigger update check (user clicks "check now") [手动触发更新检查 (用户点击「立即检查」)]
 */
function checkUpdateManually() {
    if (!electron_1.app.isPackaged) {
        console.log('[Updater] Development environment, manual update disabled');
        broadcastToast({ key: 'updater.toast.devEnvDisabled' }, 'info', 10000);
        return;
    }
    if (updateDisabled) {
        console.log('[Updater] Update disabled, cannot check manually');
        broadcastToast({ key: 'updater.toast.disabledByCli' }, 'warning', 3000);
        return;
    }
    if (isChecking || isUpdating) {
        broadcastToast({ key: 'updater.toast.checking' }, 'info', 3000);
        return;
    }
    isChecking = true;
    console.log('[Updater] Manual check triggered');
    const win = electron_1.BrowserWindow.getFocusedWindow();
    if (win) {
        win.webContents.send('updater:status-change', { checking: true });
    }
    performUpdate((msg, percent) => {
        console.log(`[Updater] Manual progress: ${msg} (${percent}%)`);
        if (win) {
            win.webContents.send('updater:progress', { msg, percent });
        }
    }, (success, error, friendlyError) => {
        isChecking = false;
        if (win) {
            win.webContents.send('updater:status-change', { checking: false });
            if (success) {
                win.webContents.send('updater:status-change', { done: true });
            }
            else if (error) {
                win.webContents.send('updater:status-change', { error });
                if (friendlyError) {
                    // Friendly error is usually pre-assembled Chinese in main process, pass i18n key to renderer [友好错误一般是主进程拼好的中文，交给渲染层时传 i18n key]
                    broadcastToast({ key: 'updater.toast.updateFailedWithReason', params: { reason: friendlyError } }, 'error', 8000);
                }
                else {
                    broadcastToast({ key: 'updater.toast.updateFailedGeneric' }, 'error', 6000);
                }
            }
        }
        if (success) {
            console.log('[Updater] Manual update completed');
        }
        else if (error) {
            console.error('[Updater] Manual update failed:', error);
            if (!win) {
                promptRendererDialog('manual-update-failed', {
                    error: friendlyError || error || 'Unknown error'
                });
            }
        }
    });
}
/**
 * Force config override in development environment [开发环境强制覆盖配置]
 */
async function applyDevConfigOverride() {
    if (electron_1.app.isPackaged)
        return;
    console.log('[Updater] Development mode: applying config override');
    const config = await (0, config_manager_1.readConfig)();
    const changed = [];
    if (config.updateBehavior !== 'disabled') {
        config.updateBehavior = 'disabled';
        changed.push('updateBehavior');
    }
    if (config.checkInterval !== 1800000) {
        config.checkInterval = 1800000;
        changed.push('checkInterval');
    }
    if (changed.length > 0) {
        await (0, config_manager_1.writeConfig)(config);
        console.log('[Updater] Dev config override applied:', changed.join(', '));
        (0, config_manager_1.broadcastConfigChange)(config);
    }
}
/**
 * Rollback handling: called after file integrity check failure [回滚处理：文件完整性校验失败后调用]
 * 1. First check if persistent cache has ZIP for current version [先查持久缓存中有没有当前版本的 ZIP]
 * 2. If found and intact → ask user if they want to reinstall from cached ZIP [若有且校验完好 → 弹窗问用户要不要用缓存 ZIP 直接重装]
 * 3. If cached ZIP is corrupted → delete corrupted file, prompt user to download from official site [若缓存 ZIP 损坏 → 删掉损坏文件，弹窗提示用户去官网下载]
 */
async function handleIntegrityRollback(currentVersion, errors) {
    const versionWithV = `v${currentVersion}`;
    const githubReleaseUrl = `https://github.com/${constants_1.GITHUB_OWNER}/${constants_1.GITHUB_REPO}/releases/tag/${versionWithV}`;
    // Check cache first [先看缓存里有没有]
    const verifyResult = await cacheManager.verifyCachedZip(versionWithV, verify_1.computeSha256);
    if (verifyResult.ok && verifyResult.zipPath) {
        // Cache intact, ask user if they want to reinstall from cache [缓存完好，问用户要不要直接用缓存重装]
        // 0=reinstall from cache, 1=download from official, 2=later [0=用缓存重装, 1=去官网下载, 2=稍后再说]
        const choice = await promptRendererDialog('rollback-with-cache', {
            version: versionWithV,
            errors: errors || [],
            zipPath: verifyResult.zipPath
        });
        if (choice.buttonIndex === 0) {
            // User chose "reinstall from cache" [用户选了「使用缓存重新安装」]
            console.log('[Rollback] User chose rollback from cached zip:', verifyResult.zipPath);
            const tempResult = await (0, temp_manager_1.acquireTempDir)();
            if (!tempResult.success) {
                // showErrorBox simple error: use broadcastToast + simple-error dialog [showErrorBox 简单错误：走 broadcastToast + simple-error 弹窗]
                broadcastToast({ key: 'updater.rollback.errorCreateTempDir' }, 'error', 8000);
                await promptRendererDialog('simple-error', {
                    titleKey: 'updater.rollback.errorCreateTempDir.title',
                    bodyKey: 'updater.rollback.errorCreateTempDir.body'
                }).catch(() => { });
                return;
            }
            // Copy cached ZIP to temp dir to avoid operating on cache directory itself [把缓存 ZIP 拷一份到临时目录，避免对缓存目录本身操作]
            const tempZipPath = path.join(tempResult.path, path.basename(verifyResult.zipPath));
            try {
                await fs.copy(verifyResult.zipPath, tempZipPath);
            }
            catch (err) {
                console.error('[Rollback] Failed to copy cached zip to temp:', err);
                broadcastToast({ key: 'updater.rollback.errorCopyCache' }, 'error', 8000);
                await promptRendererDialog('simple-error', {
                    titleKey: 'updater.rollback.errorCopyCache.title',
                    bodyKey: 'updater.rollback.errorCopyCache.body',
                    detail: err instanceof Error ? err.message : String(err)
                }).catch(() => { });
                await (0, temp_manager_1.releaseTempDir)(tempResult.path, tempResult.isManual);
                return;
            }
            pendingUpdate = {
                zipPath: tempZipPath,
                tempDir: tempResult.path,
                isManualDir: tempResult.isManual,
                targetVersion: currentVersion
            };
            // 0=restart and reinstall now, 1=later (reinstall on exit) [0=立即重启重装, 1=稍后 (退出时重装)]
            const restartChoice = await promptRendererDialog('rollback-restart', {
                version: versionWithV
            });
            if (restartChoice.buttonIndex === 0) {
                setTimeout(() => electron_1.app.quit(), 300);
            }
            return;
        }
        if (choice.buttonIndex === 1) {
            // User chose "download from official" [用户选了「去官网下载」]
            electron_2.shell.openExternal(githubReleaseUrl).catch(() => { });
            return;
        }
        // Chose "later" → no action [选了稍后再说 → 不操作]
        return;
    }
    // No available cache: if cached ZIP is corrupted, remove it first [没有可用缓存：若缓存 ZIP 损坏则先清掉损坏的]
    if (verifyResult.reason && verifyResult.reason.startsWith('hash-mismatch') && verifyResult.zipPath) {
        try {
            await fs.remove(verifyResult.zipPath);
            await cacheManager.clearCacheByVersion(versionWithV);
            console.log('[Rollback] Removed corrupted cached zip');
        }
        catch { /* ignore [忽略] */ }
    }
    // Fallback to "prompt to download from official" [走「提示去官网」的兜底]
    // First show Toast (i18n key) [先弹 Toast (i18n key)]
    broadcastToast({ key: 'updater.rollback.toastCorruptedNoCache' }, 'error', 12000);
    // 0=download from official, 1=OK [0=去官网下载, 1=确定]
    const choice = await promptRendererDialog('rollback-no-cache', {
        version: versionWithV,
        errors: errors || [],
        releaseUrl: githubReleaseUrl
    });
    if (choice.buttonIndex === 0) {
        electron_2.shell.openExternal(githubReleaseUrl).catch(() => { });
    }
}
function initUpdater() {
    checkDisableFlags();
    // Register renderer custom dialog response handler (register once only) [注册渲染层自定义弹窗响应 handler (仅注册一次)]
    ensureDialogResponseHandler();
    (0, config_manager_1.startConfigWatcher)();
    // ========== On startup: clean expired cache ========== [启动时：清理过期缓存]
    setTimeout(async () => {
        try {
            let retentionDays = null;
            try {
                retentionDays = await (0, config_manager_1.getConfigItem)('cacheRetentionDays');
            }
            catch { /* ignore [忽略] */ }
            await cacheManager.cleanupExpired(retentionDays);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn('[Updater] Cache cleanup failed (non-critical):', msg);
        }
    }, 1500);
    // ========== On startup: file integrity check (failure triggers rollback) ========== [启动时文件完整性校验 (失败则走回滚流程)]
    setTimeout(async () => {
        try {
            const currentVersion = (0, check_1.getCurrentVersion)();
            const result = await (0, verify_1.verifyInstalledFiles)(currentVersion, (msg, pct) => {
                console.log(`[Verify] ${msg} (${pct}%)`);
            });
            if (!result.success) {
                console.warn('[Verify] Integrity check failed:', result.errors);
                // Switch to rollback flow (use cache if available, otherwise prompt to download from official) [改为走回滚流程 (有缓存用缓存，没缓存提示官网下载)]
                await handleIntegrityRollback(currentVersion, result.errors);
            }
        }
        catch (err) {
            console.error('[Verify] Integrity check error:', err);
        }
    }, 3000);
    // ========== End of startup file integrity check ========== [启动时文件完整性校验结束]
    (0, verify_1.selfCheckIntegrity)().then(async (result) => {
        if (!result.success) {
            console.warn('[Updater] Integrity self-check warning:', result.error);
            // exe corrupted/tampered: also go through rollback (reinstall from cache if intact, otherwise prompt official download) [exe 损坏/篡改：同样走回滚流程 (缓存完好则重装，否则提示官网下载)]
            try {
                const version = (0, check_1.getCurrentVersion)();
                await handleIntegrityRollback(version, [result.error || '可执行文件完整性校验失败']);
            }
            catch (err) {
                console.error('[Updater] Self-check rollback failed:', err);
            }
        }
    });
    if (pendingUpdate) {
        console.log('[Updater] Pending update found, will install on app exit');
    }
    electron_1.app.on('before-quit', async (event) => {
        if (pendingUpdate) {
            event.preventDefault();
            await checkPendingUpdate();
        }
    });
    startUpdateTimer();
    if (!electron_1.app.isPackaged) {
        console.log('[Updater] Development environment detected');
        setTimeout(async () => {
            await applyDevConfigOverride();
            broadcastToast({ key: 'updater.toast.devEnvAutoDisabled' }, 'info', 10000);
            const config = await (0, config_manager_1.readConfig)();
            (0, config_manager_1.broadcastConfigChange)(config);
        }, 2000);
    }
    console.log('[Updater] Update module initialized');
}
exports.updaterState = {
    get isUpdating() { return isUpdating; },
    get pendingUpdate() { return pendingUpdate; },
    get updateDisabled() { return updateDisabled; },
    get isChecking() { return isChecking; }
};
//# sourceMappingURL=index.js.map