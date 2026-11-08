// Updater dialog content: new version found [更新器弹窗内容 - 发现新版本]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { escapeHtml } from 'sparklet/renderer/shared/ui/dom/dom-utils.js';
import type { DialogContent } from 'sparklet/renderer/shared/updater/dialog/updater-dialog-types.js';

// ========== 1. New version found (two buttons) [发现新版本 (双按钮)] ==========
export function buildUpdateConfirm(params: Record<string, unknown>): DialogContent {
  const title = t('dialog.updateConfirm.title');
  const bodyHtml = `
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.newVersion')}:</b> ${escapeHtml(params.newVersion)}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.codename')}:</b> ${escapeHtml(params.codename)}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.releaseDate')}:</b> ${escapeHtml(params.releaseDate)}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.hashPrefix')}:</b> ${escapeHtml(params.hashPrefix || '—')}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.currentVersion')}:</b> ${escapeHtml(params.currentVersion)}</div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.updateConfirm.ask')}</div>
      `;
  return {
    title,
    bodyHtml,
    buttons: [
      { index: 1, label: t('dialog.updateConfirm.btnLater'), style: 'cancel' },
      { index: 0, label: t('dialog.updateConfirm.btnUpdate'), style: 'ok' },
    ],
  };
}
