// Renderer custom dialog core - replaces native system dialog [渲染层自定义弹窗核心 - 替换系统原生 dialog]
// Handles dialog lifecycle: find window, prompt renderer, system fallback, response handler [处理弹窗生命周期：查找窗口、提示渲染层、系统兜底、响应 handler]

import { dialog, BrowserWindow, ipcMain } from 'electron';
import type {
  DialogPayload,
  DialogResponse,
} from '../../shared/types/updater';

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
