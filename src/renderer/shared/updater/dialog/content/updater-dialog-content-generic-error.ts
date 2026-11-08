// Updater dialog content: generic simple error [更新器弹窗内容 - 通用简单错误]

import { t } from '../../../i18n/i18n.js';
import { escapeHtml } from '../../../ui/dom/dom-utils.js';
import type { DialogContent } from '../updater-dialog-types.js';

// ========== 10. Simple error (generic) [简单错误 (通用)] ==========
export function buildSimpleError(params: Record<string, unknown>): DialogContent {
  const title = t(String(params.titleKey || 'dialog.simpleError.title'));
  const bodyHtml = `
        <div class="upd-info-row">${t(String(params.bodyKey || 'dialog.simpleError.body'))}</div>
        ${params.detail ? `<div class="upd-info-row" style="margin-top:10px;font-size:12px;color:#666;word-break:break-all;">${escapeHtml(params.detail)}</div>` : ''}
      `;
  return {
    title,
    bodyHtml,
    buttons: [{ index: 0, label: t('dialog.simpleError.btnOk'), style: 'ok' }],
  };
}
