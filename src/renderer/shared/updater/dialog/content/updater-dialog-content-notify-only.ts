// Updater dialog content: notify only [更新器弹窗内容 - 仅提醒]

import { t } from '../../../i18n/i18n.js';
import { escapeHtml } from '../../../ui/dom/dom-utils.js';
import type { DialogContent } from '../updater-dialog-types.js';

// ========== 2. Notify only (single button + open official) [仅提醒 (单按钮 + 打开官网)] ==========
export function buildNotifyOnly(params: Record<string, unknown>): DialogContent {
  const title = t('dialog.notifyOnly.title');
  const url = String(params.releaseUrl || '');
  const bodyHtml = `
        <div class="upd-info-row"><b>${t('dialog.notifyOnly.newVersion')}:</b> ${escapeHtml(params.newVersion)}</div>
        <div class="upd-info-row"><b>${t('dialog.notifyOnly.codename')}:</b> ${escapeHtml(params.codename)}</div>
        <div class="upd-info-row"><b>${t('dialog.notifyOnly.releaseDate')}:</b> ${escapeHtml(params.releaseDate)}</div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.notifyOnly.tip')}</div>
        <div class="upd-info-row upd-url-box" style="word-break:break-all;background:#f6f6f6;padding:8px 10px;border-radius:6px;margin-top:6px;">
          <a href="${escapeHtml(url)}" target="_blank" data-open-external="${escapeHtml(url)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(url)}</a>
        </div>
      `;
  return {
    title,
    bodyHtml,
    buttons: [{ index: 0, label: t('dialog.notifyOnly.btnGotIt'), style: 'ok' }],
  };
}
