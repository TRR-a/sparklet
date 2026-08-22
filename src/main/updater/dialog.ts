// Updater dialog system and utilities [更新器弹窗系统与工具函数]
// Handles renderer custom dialogs, toast broadcast, and friendly error formatting [处理渲染层自定义弹窗、Toast 广播和友好错误格式化]

import { dialog, BrowserWindow, ipcMain } from 'electron';
import type {
  ManifestEntry,
  ToastData,
  DialogPayload,
  DialogResponse,
  NetworkErrorType
} from '../../shared/types/updater';
import { classifyNetworkError } from './constants';

// ==================== Renderer custom dialog (replaces native system dialog) ==================== [渲染层自定义弹窗 (替换系统原生 dialog)]

/** Dialog response pending entry [弹窗响应待处理条目] */
interface PendingDialogEntry {
  resolve: (response: DialogResponse) => void;
  timer: NodeJS.Timeout | null;
}

/**
 * Map<dialogId, { resolve, timer, fallback }> Renderer responds to user action via ipcMain.handle('updater:dialog-response') [Map<dialogId, { resolve, timer, fallback }> 渲染层响应用户操作后通过 ipcMain.handle('updater:dialog-response') 回传]
 */
const pendingDialogResponses = new Map<string, PendingDialogEntry>();
let dialogIdSeq = 0;

/** Progress callback type [进度回调类型] */
export type ProgressCallback = (msg: string, percent: number) => void;

/** Complete callback type [完成回调类型] */
export type CompleteCallback = (success: boolean, error: string | null, friendlyError?: string) => void;

/** Dialog params type [弹窗参数类型] */
export type DialogParams = Record<string, unknown>;

/** Dialog options [弹窗选项] */
export interface DialogOptions {
  timeoutMs?: number;
  fallbackResponse?: DialogResponse;
  fallbackToSystemDialog?: boolean;
}

/**
 * Find an available BrowserWindow (prefer focused window, then any window) [找一个可用的 BrowserWindow (优先聚焦窗口，其次任意窗口)]
 */
export function findAvailableWindow(): BrowserWindow | null {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused && !focused.isDestroyed()) return focused;
  const all = BrowserWindow.getAllWindows().filter(w => !w.isDestroyed());
  return all.length > 0 ? all[0] : null;
}

/**
 * Show custom UI dialog via renderer (i18n friendly, unified style) [通过渲染层弹自定义 UI 对话框 (i18n 友好，统一风格)]
 * @param dialogType Dialog type: update-confirm / notify-only / restart-confirm / rollback-with-cache / rollback-restart / rollback-no-cache / manual-update-failed / simple-error / temp-dir-error / temp-dir-not-empty [弹窗类型]
 * @param params Params passed to renderer for display (version / codename / errors etc.) [传给渲染层用于显示的参数 (version / codename / errors 等)]
 * @param options Dialog options [弹窗选项]
 * @returns User's selection result (usually { buttonIndex: number }) [用户选择的结果 (通常是 { buttonIndex: number })]
 */
export async function promptRendererDialog(
  dialogType: string,
  params: DialogParams = {},
  options: DialogOptions = {}
): Promise<DialogResponse> {
  const {
    timeoutMs = 0,
    fallbackResponse = { buttonIndex: 1 },
    fallbackToSystemDialog = true
  } = options;

  const win = findAvailableWindow();

  // No available window: fall back to system dialog [没有可用窗口：走系统 dialog 兜底]
  if (!win) {
    if (!fallbackToSystemDialog) return fallbackResponse;
    console.warn('[Updater] No renderer window available, falling back to system dialog for type=' + dialogType);
    return systemDialogFallback(dialogType, params);
  }

  const dialogId = `dlg_${Date.now()}_${(++dialogIdSeq)}`;
  const payload: DialogPayload = { dialogId, dialogType, params, timeoutMs };

  return new Promise<DialogResponse>((resolve) => {
    let timer: NodeJS.Timeout | null = null;
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
function systemDialogFallback(dialogType: string, params: DialogParams): Promise<DialogResponse> {
  const title = `Sparklet Update - ${dialogType}`;
  const detail = Object.entries(params || {})
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
    .join('\n');

  if (dialogType === 'rollback-no-cache' || dialogType === 'rollback-with-cache' || dialogType === 'manual-update-failed' || dialogType === 'simple-error') {
    return dialog.showMessageBox({
      type: 'error', title, message: title, detail,
      buttons: ['OK'], defaultId: 0
    }).then(r => ({ buttonIndex: r.response }));
  }

  return dialog.showMessageBox({
    type: 'info', title, message: title, detail,
    buttons: ['OK'], defaultId: 0
  }).then(r => ({ buttonIndex: r.response }));
}

/**
 * Renderer response handler: updater:dialog-response Register once during initUpdater (prevent duplicate registration) [渲染层回传响应：updater:dialog-response 在 initUpdater 时注册一次 handle (防止重复注册)]
 */
let dialogResponseHandlerRegistered = false;
export function ensureDialogResponseHandler(): void {
  if (dialogResponseHandlerRegistered) return;
  dialogResponseHandlerRegistered = true;

  ipcMain.handle('updater:dialog-response', (_event, { dialogId, response }: { dialogId: string; response: DialogResponse }) => {
    const entry = pendingDialogResponses.get(dialogId);
    if (!entry) {
      console.warn('[Updater] Received dialog-response for unknown/expired id:', dialogId);
      return { ok: false, reason: 'unknown-dialog-id' };
    }
    pendingDialogResponses.delete(dialogId);
    if (entry.timer) clearTimeout(entry.timer);
    console.log(`[Updater] Dialog response received: id=${dialogId}, response=`, response);
    entry.resolve(response);
    return { ok: true };
  });
}

/**
 * Format date for display [格式化日期显示]
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '未知';
  try {
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  } catch {
    return String(isoString);
  }
}

/**
 * Show "new version found" dialog (renderer custom UI, i18n friendly) [显示「发现新版本」对话框 (渲染层自定义 UI，i18n 友好)]
 * @returns 0=update now, 1=later [0=立即更新, 1=稍后]
 */
export async function showUpdateDialog(currentVersion: string, entry: ManifestEntry): Promise<DialogResponse> {
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
export async function showNotifyOnlyDialog(currentVersion: string, entry: ManifestEntry, releaseUrl: string): Promise<DialogResponse> {
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
export async function showRestartDialog(targetVersion: string, entry: ManifestEntry): Promise<DialogResponse & { timedOut?: boolean }> {
  const version = entry.version || `v${targetVersion}`;
  const codename = entry.internalCodename || 'N/A';
  const releaseDate = formatDate(entry.releaseDate);

  const response = await promptRendererDialog(
    'restart-confirm',
    {
      targetVersion: version,
      codename,
      releaseDate
    },
    {
      timeoutMs: 30000,
      fallbackResponse: { buttonIndex: 1, timedOut: true }
    }
  );
  return response;
}

/**
 * Broadcast Toast to all windows [向所有窗口发送 Toast (广播)]
 * message supports two formats: [message 支持两种格式：]
 *   - String: display directly (backward compat), won't auto-translate on language switch [字符串：直接显示 (兼容旧代码)，不会随语言切换自动翻译]
 *   - { key: 'i18n.key.path', params?: { foo: 'bar' } }: renderer calls t(key, params) to translate, supports language switch [{ key: 'i18n.key.path', params?: { foo: 'bar' } }：渲染层会调 t(key, params) 翻译，支持语言切换]
 */
export function broadcastToast(
  message: string | { key: string; params?: Record<string, string> },
  type: ToastData['type'] = 'info',
  duration: number = 3000
): void {
  const windows = BrowserWindow.getAllWindows();
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
export function formatFriendlyUpdateError(
  errorMsg: string | null,
  errorType: NetworkErrorType | null,
  context: 'check' | 'download-zip' | 'download-manifest' | 'verify' | 'install' = 'check'
): string {
  const type: NetworkErrorType = (errorType && errorType !== 'unknown')
    ? errorType
    : classifyNetworkError(errorMsg);

  const ctxLabel = (() => {
    switch (context) {
      case 'download-zip':     return '下载更新包';
      case 'download-manifest':return '获取版本信息';
      case 'verify':           return '校验安装包';
      case 'install':          return '安装更新';
      case 'check':
      default:                 return '检查更新';
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
      if (m.includes('invalid tag format')) return `⚠️ ${ctxLabel}失败：GitHub Release 版本号格式异常`;
      if (m.includes('invalid zip filename')) return `⚠️ ${ctxLabel}失败：更新包文件名格式不匹配`;
      if (m.includes('manifest.releases.json not found')) return `⚠️ ${ctxLabel}失败：更新清单文件缺失，请稍后重试`;
      if (m.includes('failed to parse github api')) return `⚠️ ${ctxLabel}失败：GitHub 返回数据异常`;
      if (m.includes('unable to acquire temp directory')) return `⚠️ ${ctxLabel}失败：无法创建临时目录，请检查权限`;
      if (m.includes('sha256') || m.includes('packagehash') || m.includes('hash mismatch') || m.includes('integrity')) {
        return `⚠️ ${ctxLabel}失败：安装包完整性校验未通过（文件可能损坏），请重新下载`;
      }
      // Completely unknown: add generic fallback [完全未知：带一句通用兜底]
      return `⚠️ ${ctxLabel}失败，请稍后重试或去 GitHub 官网手动下载`;
    }
  }
}
