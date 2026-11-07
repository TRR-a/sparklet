// Rollback dialog: restart confirm (two buttons) [回滚弹窗 - 重启确认 (双按钮)]

import { t } from '../i18n/i18n.js';
import type { DialogContent } from './updater-dialog-types.js';

export function buildRollbackRestart(params: Record<string, unknown>): DialogContent {
  const title = t('dialog.rollbackRestart.title');
  const bodyHtml = `
        <div class="upd-info-row">${t('dialog.rollbackRestart.ready', { version: String(params.version || '') })}</div>
        <div class="upd-info-row" style="margin-top:10px;">${t('dialog.rollbackRestart.ask')}</div>
      `;
  return {
    title,
    bodyHtml,
    buttons: [
      { index: 1, label: t('dialog.rollbackRestart.btnLater'), style: 'cancel' },
      { index: 0, label: t('dialog.rollbackRestart.btnRestart'), style: 'ok' },
    ],
  };
}
