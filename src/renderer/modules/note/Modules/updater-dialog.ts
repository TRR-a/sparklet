// Updater custom dialog - replaces native system dialog for update notifications [更新器自定义弹窗 - 替换系统原生弹窗用于更新通知]
// Handles 8 dialog types: update-confirm, notify-only, restart-confirm, rollback-with-cache, rollback-restart, rollback-no-cache, manual-update-failed, simple-error [处理 8 种弹窗类型]

import { t } from './i18n.js';
import { escapeHtml } from '../Base/dom-utils.js';

/** Dialog button definition [弹窗按钮定义] */
interface DialogButton {
  index: number;
  label: string;
  style: 'ok' | 'cancel' | 'default';
  onClick?: () => void;
}

/** Updater dialog params from main process [来自主进程的更新器弹窗参数] */
export interface UpdaterDialogParams {
  dialogId: string;
  dialogType: string;
  params: Record<string, unknown>;
  timeoutMs: number;
}

/**
 * Open external URL via main process IPC (with http/https protocol whitelist) [通过主进程 IPC 打开外链 (带 http/https 协议白名单)]
 */
function openExternal(url: string): void {
  if (window.electronAPI && window.electronAPI.invoke) {
    window.electronAPI.invoke('app:open-external', url).catch((): void => {});
  }
}

/**
 * Show updater dialog based on type, user response sent back via IPC [根据类型显示更新器弹窗，用户响应通过 IPC 回传]
 * @param dialogId Unique dialog ID from main process [主进程传的唯一 dialogId]
 * @param dialogType Dialog type [弹窗类型]
 * @param params Params for display (version / errors etc.) [显示参数]
 * @param timeoutMs Timeout in ms (0=no timeout) [超时毫秒 (0=无超时)]
 */
export function showUpdaterDialog(
  dialogId: string,
  dialogType: string,
  params: Record<string, unknown>,
  timeoutMs: number = 0
): void {
  const modalEl = document.getElementById('updaterDialogModal');
  const titleEl = document.getElementById('updaterDialogTitle');
  const bodyEl = document.getElementById('updaterDialogBody');
  const buttonsEl = document.getElementById('updaterDialogButtons');
  if (!modalEl || !titleEl || !bodyEl || !buttonsEl) return;

  let title = '';
  let bodyHtml = '';
  const buttons: DialogButton[] = [];

  /** Send user response back to main process [将用户响应回传给主进程] */
  const sendResponse = async (buttonIndex: number, extra: Record<string, unknown> = {}): Promise<void> => {
    (modalEl as HTMLElement).style.display = 'none';
    if (window.electronAPI && window.electronAPI.sendUpdateDialogResponse) {
      try {
        await window.electronAPI.sendUpdateDialogResponse(dialogId, { buttonIndex, ...extra });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('sendUpdateDialogResponse failed:', msg);
      }
    }
  };

  switch (dialogType) {
    // ========== 1. New version found (two buttons) [发现新版本 (双按钮)] ==========
    case 'update-confirm': {
      title = t('dialog.updateConfirm.title');
      bodyHtml = `
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.newVersion')}:</b> ${escapeHtml(params.newVersion)}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.codename')}:</b> ${escapeHtml(params.codename)}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.releaseDate')}:</b> ${escapeHtml(params.releaseDate)}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.hashPrefix')}:</b> ${escapeHtml(params.hashPrefix || '—')}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.currentVersion')}:</b> ${escapeHtml(params.currentVersion)}</div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.updateConfirm.ask')}</div>
      `;
      buttons.push({ index: 1, label: t('dialog.updateConfirm.btnLater'), style: 'cancel' });
      buttons.push({ index: 0, label: t('dialog.updateConfirm.btnUpdate'), style: 'ok' });
      break;
    }
    // ========== 2. Notify only (single button + open official) [仅提醒 (单按钮 + 打开官网)] ==========
    case 'notify-only': {
      title = t('dialog.notifyOnly.title');
      const url = String(params.releaseUrl || '');
      bodyHtml = `
        <div class="upd-info-row"><b>${t('dialog.notifyOnly.newVersion')}:</b> ${escapeHtml(params.newVersion)}</div>
        <div class="upd-info-row"><b>${t('dialog.notifyOnly.codename')}:</b> ${escapeHtml(params.codename)}</div>
        <div class="upd-info-row"><b>${t('dialog.notifyOnly.releaseDate')}:</b> ${escapeHtml(params.releaseDate)}</div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.notifyOnly.tip')}</div>
        <div class="upd-info-row upd-url-box" style="word-break:break-all;background:#f6f6f6;padding:8px 10px;border-radius:6px;margin-top:6px;">
          <a href="${escapeHtml(url)}" target="_blank" data-open-external="${escapeHtml(url)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(url)}</a>
        </div>
      `;
      buttons.push({ index: 0, label: t('dialog.notifyOnly.btnGotIt'), style: 'ok' });
      break;
    }
    // ========== 3. Restart confirmation (two buttons + 30s timeout countdown) [重启确认 (双按钮 + 30s 超时倒计时)] ==========
    case 'restart-confirm': {
      title = t('dialog.restartConfirm.title');
      bodyHtml = `
        <div class="upd-info-row"><b>${t('dialog.restartConfirm.version')}:</b> ${escapeHtml(params.targetVersion)}</div>
        <div class="upd-info-row"><b>${t('dialog.restartConfirm.codename')}:</b> ${escapeHtml(params.codename)}</div>
        <div class="upd-info-row"><b>${t('dialog.restartConfirm.releaseDate')}:</b> ${escapeHtml(params.releaseDate)}</div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.restartConfirm.ask')}</div>
        <div id="restartCountdown" class="upd-info-row" style="margin-top:8px;color:#666;font-size:13px;"></div>
      `;
      buttons.push({ index: 1, label: t('dialog.restartConfirm.btnLater'), style: 'cancel' });
      buttons.push({ index: 0, label: t('dialog.restartConfirm.btnRestart'), style: 'ok' });

      // 30s countdown display [30s 倒计时显示]
      if (timeoutMs > 0) {
        let remaining = Math.round(timeoutMs / 1000);
        const timerId = setInterval((): void => {
          remaining -= 1;
          const cdEl = document.getElementById('restartCountdown');
          if (cdEl) {
            cdEl.textContent = t('dialog.restartConfirm.countdown', { seconds: String(remaining) });
          }
          if (remaining <= 0) {
            clearInterval(timerId);
          }
          const modalCheck = document.getElementById('updaterDialogModal');
          if (!modalCheck || modalCheck.style.display === 'none') {
            clearInterval(timerId);
          }
        }, 1000);
        const cdEl = document.getElementById('restartCountdown');
        if (cdEl) cdEl.textContent = t('dialog.restartConfirm.countdown', { seconds: String(remaining) });
      }
      break;
    }
    // ========== 4. Rollback with cache (three buttons) [回滚-有缓存 (三按钮)] ==========
    case 'rollback-with-cache': {
      title = t('dialog.rollbackCache.title');
      const errs = Array.isArray(params.errors) ? params.errors as string[] : [];
      bodyHtml = `
        <div class="upd-info-row">${t('dialog.rollbackCache.intro')}</div>
        <div class="upd-info-row" style="margin-top:10px;background:#ecfdf5;padding:8px 10px;border-radius:6px;border:1px solid #10b981;color:#065f46;">
          ✅ ${t('dialog.rollbackCache.cacheAvailable', { version: String(params.version || '') })}
        </div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.rollbackCache.ask')}</div>
        ${errs.length > 0 ? `
          <details style="margin-top:10px;"><summary style="cursor:pointer;color:#666;">${t('dialog.rollbackCache.errorsLabel')}</summary>
            <pre style="margin:6px 0 0;padding:8px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;white-space:pre-wrap;word-break:break-all;font-size:12px;">${escapeHtml(errs.join('\n'))}</pre>
          </details>` : ''}
      `;
      buttons.push({ index: 2, label: t('dialog.rollbackCache.btnLater'), style: 'cancel' });
      buttons.push({
        index: 1,
        label: t('dialog.rollbackCache.btnOfficial'),
        style: 'default',
        onClick: (): void => { if (params.releaseUrl) openExternal(String(params.releaseUrl)); }
      });
      buttons.push({ index: 0, label: t('dialog.rollbackCache.btnRollback'), style: 'ok' });
      break;
    }
    // ========== 5. Rollback restart confirm (two buttons) [回滚-重启确认 (双按钮)] ==========
    case 'rollback-restart': {
      title = t('dialog.rollbackRestart.title');
      bodyHtml = `
        <div class="upd-info-row">${t('dialog.rollbackRestart.ready', { version: String(params.version || '') })}</div>
        <div class="upd-info-row" style="margin-top:10px;">${t('dialog.rollbackRestart.ask')}</div>
      `;
      buttons.push({ index: 1, label: t('dialog.rollbackRestart.btnLater'), style: 'cancel' });
      buttons.push({ index: 0, label: t('dialog.rollbackRestart.btnRestart'), style: 'ok' });
      break;
    }
    // ========== 6. Rollback no cache (two buttons + error details) [回滚-无缓存 (双按钮 + 错误详情)] ==========
    case 'rollback-no-cache': {
      title = t('dialog.rollbackNoCache.title');
      const errs = Array.isArray(params.errors) ? params.errors as string[] : [];
      const url = String(params.releaseUrl || '');
      bodyHtml = `
        <div class="upd-info-row">${t('dialog.rollbackNoCache.intro')}</div>
        <div class="upd-info-row" style="margin-top:10px;background:#fef2f2;padding:8px 10px;border-radius:6px;border:1px solid #ef4444;color:#7f1d1d;">
          ⚠️ ${t('dialog.rollbackNoCache.noCacheTip')}
        </div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.rollbackNoCache.downloadTip')}</div>
        <div class="upd-info-row upd-url-box" style="word-break:break-all;background:#f6f6f6;padding:8px 10px;border-radius:6px;margin-top:6px;">
          <a href="${escapeHtml(url)}" target="_blank" data-open-external="${escapeHtml(url)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(url)}</a>
        </div>
        ${errs.length > 0 ? `
          <details style="margin-top:10px;"><summary style="cursor:pointer;color:#666;">${t('dialog.rollbackNoCache.errorsLabel')}</summary>
            <pre style="margin:6px 0 0;padding:8px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;white-space:pre-wrap;word-break:break-all;font-size:12px;">${escapeHtml(errs.join('\n'))}</pre>
          </details>` : ''}
      `;
      buttons.push({ index: 1, label: t('dialog.rollbackNoCache.btnOk'), style: 'cancel' });
      buttons.push({ index: 0, label: t('dialog.rollbackNoCache.btnOfficial'), style: 'ok', onClick: (): void => openExternal(url) });
      break;
    }
    // ========== 7. Manual update failed (single button) [手动更新失败 (单按钮)] ==========
    case 'manual-update-failed': {
      title = t('dialog.manualFailed.title');
      bodyHtml = `
        <div class="upd-info-row">${t('dialog.manualFailed.tip')}</div>
        <div class="upd-info-row" style="margin-top:10px;background:#fef2f2;padding:8px 10px;border-radius:6px;border:1px solid #ef4444;color:#7f1d1d;word-break:break-all;">
          ${escapeHtml(params.error || '')}
        </div>
      `;
      buttons.push({ index: 0, label: t('dialog.manualFailed.btnOk'), style: 'ok' });
      break;
    }
    // ========== 8. Simple error (generic) [简单错误 (通用)] ==========
    case 'simple-error':
    default: {
      title = t(String(params.titleKey || 'dialog.simpleError.title'));
      bodyHtml = `
        <div class="upd-info-row">${t(String(params.bodyKey || 'dialog.simpleError.body'))}</div>
        ${params.detail ? `<div class="upd-info-row" style="margin-top:10px;font-size:12px;color:#666;word-break:break-all;">${escapeHtml(params.detail)}</div>` : ''}
      `;
      buttons.push({ index: 0, label: t('dialog.simpleError.btnOk'), style: 'ok' });
      break;
    }
  }

  // Apply title/body [应用标题/内容]
  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;

  // Handle external link clicks via main process shell.openExternal [处理链接点击，通过主进程 shell.openExternal 打开]
  bodyEl.querySelectorAll('[data-open-external]').forEach((a: Element) => {
    a.addEventListener('click', (ev: Event) => {
      ev.preventDefault();
      const u = a.getAttribute('data-open-external');
      if (u) openExternal(u);
    });
  });

  // Render buttons [渲染按钮]
  buttonsEl.innerHTML = '';
  buttons.sort((a, b) => a.index - b.index).forEach((btn: DialogButton) => {
    const b = document.createElement('button');
    b.className = 'custom-confirm-btn ' + (btn.style || 'default');
    b.textContent = btn.label;
    b.addEventListener('click', () => {
      if (typeof btn.onClick === 'function') {
        try { btn.onClick(); } catch { /* ignore [忽略] */ }
      }
      sendResponse(btn.index);
    });
    buttonsEl.appendChild(b);
  });

  // Show dialog [显示弹窗]
  (modalEl as HTMLElement).style.display = 'flex';
}

/**
 * Bind updater dialog listener (receives dialog show events from main process) [绑定更新器弹窗监听 (接收来自主进程的弹窗显示事件)]
 */
export function bindUpdaterDialogListener(): void {
  if (!window.electronAPI || !window.electronAPI.onUpdateDialogShow) return;
  window.electronAPI.onUpdateDialogShow((payload: UpdaterDialogParams) => {
    console.log('[Settings] Received updater dialog show:', payload.dialogType);
    showUpdaterDialog(payload.dialogId, payload.dialogType, payload.params || {}, payload.timeoutMs || 0);
  });
}
