// Updater dialog content: temp directory prompts [更新器弹窗内容 - 临时目录提示]

import { t } from '../i18n/i18n.js';
import type { DialogContent } from './updater-dialog-types.js';

// ========== 8. Temp directory error (three buttons) [临时目录错误 (三按钮)] ==========
export function buildTempDirError(): DialogContent {
  const title = t('dialog.tempDirError.title');
  const bodyHtml = `
        <div class="upd-info-row">${t('dialog.tempDirError.message')}</div>
      `;
  return {
    title,
    bodyHtml,
    buttons: [
      { index: 2, label: t('dialog.tempDirError.btnCancel'), style: 'cancel' },
      { index: 1, label: t('dialog.tempDirError.btnSpecify'), style: 'default' },
      { index: 0, label: t('dialog.tempDirError.btnRetry'), style: 'ok' },
    ],
  };
}

// ========== 9. Directory not empty confirm (two buttons) [目录非空确认 (双按钮)] ==========
export function buildTempDirNotEmpty(): DialogContent {
  const title = t('dialog.tempDirNotEmpty.title');
  const bodyHtml = `
        <div class="upd-info-row">${t('dialog.tempDirNotEmpty.message')}</div>
      `;
  return {
    title,
    bodyHtml,
    buttons: [
      { index: 1, label: t('dialog.tempDirNotEmpty.btnReselect'), style: 'cancel' },
      { index: 0, label: t('dialog.tempDirNotEmpty.btnContinue'), style: 'ok' },
    ],
  };
}
