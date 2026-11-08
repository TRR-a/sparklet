// Rollback dialog: cache available (three buttons) [回滚弹窗 - 有缓存 (三按钮)]

import { t } from '../../i18n/i18n.js';
import type { DialogContent } from '../dialog/updater-dialog-types.js';
import { openExternal } from '../dialog/updater-dialog-external.js';
import { rollbackErrorsBlock } from './rollback-errors-block.js';

export function buildRollbackWithCache(params: Record<string, unknown>): DialogContent {
  const title = t('dialog.rollbackCache.title');
  const errs = Array.isArray(params.errors) ? params.errors as string[] : [];
  const bodyHtml = `
        <div class="upd-info-row">${t('dialog.rollbackCache.intro')}</div>
        <div class="upd-info-row" style="margin-top:10px;background:#ecfdf5;padding:8px 10px;border-radius:6px;border:1px solid #10b981;color:#065f46;">
          ✅ ${t('dialog.rollbackCache.cacheAvailable', { version: String(params.version || '') })}
        </div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.rollbackCache.ask')}</div>
        ${rollbackErrorsBlock(errs, t('dialog.rollbackCache.errorsLabel'))}
      `;
  return {
    title,
    bodyHtml,
    buttons: [
      { index: 2, label: t('dialog.rollbackCache.btnLater'), style: 'cancel' },
      {
        index: 1,
        label: t('dialog.rollbackCache.btnOfficial'),
        style: 'default',
        onClick: (): void => { if (params.releaseUrl) openExternal(String(params.releaseUrl)); }
      },
      { index: 0, label: t('dialog.rollbackCache.btnRollback'), style: 'ok' },
    ],
  };
}
