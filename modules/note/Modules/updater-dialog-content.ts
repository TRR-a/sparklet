// Updater dialog content builders - generates title, body HTML, and buttons for each dialog type [更新器弹窗内容构建器 - 为每种弹窗类型生成标题、内容 HTML 和按钮]

import { t } from './i18n.js';
import { escapeHtml } from '../Base/dom-utils.js';
import { windowApi } from '../../../src/renderer/core/index.js';

/** Dialog button definition [弹窗按钮定义] */
export interface DialogButton {
  index: number;
  label: string;
  style: 'ok' | 'cancel' | 'default';
  onClick?: () => void;
}

/** Dialog content result [弹窗内容结果] */
export interface DialogContent {
  title: string;
  bodyHtml: string;
  buttons: DialogButton[];
}

/**
 * Open external URL via main process IPC (with http/https protocol whitelist) [通过主进程 IPC 打开外链 (带 http/https 协议白名单)]
 */
export function openExternal(url: string): void {
  if (window.sparklet) {
    windowApi.openExternal(url).catch((): void => {});
  }
}

/**
 * Build dialog content based on type [根据类型构建弹窗内容]
 * @param dialogType Dialog type [弹窗类型]
 * @param params Params for display (version / errors etc.) [显示参数]
 * @param timeoutMs Timeout in ms (for restart countdown) [超时毫秒 (用于重启倒计时)]
 */
export function buildDialogContent(
  dialogType: string,
  params: Record<string, unknown>,
  timeoutMs: number = 0
): DialogContent {
  let title = '';
  let bodyHtml = '';
  const buttons: DialogButton[] = [];

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
    // ========== 8. Temp directory error (three buttons) [临时目录错误 (三按钮)] ==========
    case 'temp-dir-error': {
      title = t('dialog.tempDirError.title');
      bodyHtml = `
        <div class="upd-info-row">${t('dialog.tempDirError.message')}</div>
      `;
      buttons.push({ index: 2, label: t('dialog.tempDirError.btnCancel'), style: 'cancel' });
      buttons.push({ index: 1, label: t('dialog.tempDirError.btnSpecify'), style: 'default' });
      buttons.push({ index: 0, label: t('dialog.tempDirError.btnRetry'), style: 'ok' });
      break;
    }
    // ========== 9. Directory not empty confirm (two buttons) [目录非空确认 (双按钮)] ==========
    case 'temp-dir-not-empty': {
      title = t('dialog.tempDirNotEmpty.title');
      bodyHtml = `
        <div class="upd-info-row">${t('dialog.tempDirNotEmpty.message')}</div>
      `;
      buttons.push({ index: 1, label: t('dialog.tempDirNotEmpty.btnReselect'), style: 'cancel' });
      buttons.push({ index: 0, label: t('dialog.tempDirNotEmpty.btnContinue'), style: 'ok' });
      break;
    }
    // ========== 10. Simple error (generic) [简单错误 (通用)] ==========
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

  return { title, bodyHtml, buttons };
}
