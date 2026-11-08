// Updater dialog content: manual update failed [更新器弹窗内容 - 手动更新失败]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { escapeHtml } from 'sparklet/renderer/shared/ui/dom/dom-utils.js';
import type { DialogContent } from 'sparklet/renderer/shared/updater/dialog/updater-dialog-types.js';

// ========== 7. Manual update failed (single button) [手动更新失败 (单按钮)] ==========
export function buildManualUpdateFailed(params: Record<string, unknown>): DialogContent {
  const title = t('dialog.manualFailed.title');
  const bodyHtml = `
        <div class="upd-info-row">${t('dialog.manualFailed.tip')}</div>
        <div class="upd-info-row" style="margin-top:10px;background:#fef2f2;padding:8px 10px;border-radius:6px;border:1px solid #ef4444;color:#7f1d1d;word-break:break-all;">
          ${escapeHtml(params.error || '')}
        </div>
      `;
  return {
    title,
    bodyHtml,
    buttons: [{ index: 0, label: t('dialog.manualFailed.btnOk'), style: 'ok' }],
  };
}
