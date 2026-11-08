// Rollback dialog: no cache (two buttons + error details) [回滚弹窗 - 无缓存 (双按钮 + 错误详情)]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { escapeHtml } from 'sparklet/renderer/shared/ui/dom/dom-utils.js';
import type { DialogContent } from 'sparklet/renderer/shared/updater/dialog/updater-dialog-types.js';
import { openExternal } from 'sparklet/renderer/shared/updater/dialog/updater-dialog-external.js';
import { rollbackErrorsBlock } from 'sparklet/renderer/shared/updater/rollback/rollback-errors-block.js';

export function buildRollbackNoCache(params: Record<string, unknown>): DialogContent {
  const title = t('dialog.rollbackNoCache.title');
  const errs = Array.isArray(params.errors) ? params.errors as string[] : [];
  const url = String(params.releaseUrl || '');
  const bodyHtml = `
        <div class="upd-info-row">${t('dialog.rollbackNoCache.intro')}</div>
        <div class="upd-info-row" style="margin-top:10px;background:#fef2f2;padding:8px 10px;border-radius:6px;border:1px solid #ef4444;color:#7f1d1d;">
          ⚠️ ${t('dialog.rollbackNoCache.noCacheTip')}
        </div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.rollbackNoCache.downloadTip')}</div>
        <div class="upd-info-row upd-url-box" style="word-break:break-all;background:#f6f6f6;padding:8px 10px;border-radius:6px;margin-top:6px;">
          <a href="${escapeHtml(url)}" target="_blank" data-open-external="${escapeHtml(url)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(url)}</a>
        </div>
        ${rollbackErrorsBlock(errs, t('dialog.rollbackNoCache.errorsLabel'))}
      `;
  return {
    title,
    bodyHtml,
    buttons: [
      { index: 1, label: t('dialog.rollbackNoCache.btnOk'), style: 'cancel' },
      { index: 0, label: t('dialog.rollbackNoCache.btnOfficial'), style: 'ok', onClick: (): void => openExternal(url) },
    ],
  };
}
