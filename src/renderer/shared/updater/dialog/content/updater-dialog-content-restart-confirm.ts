// Updater dialog content: restart confirmation [更新器弹窗内容 - 重启确认]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { escapeHtml } from 'sparklet/renderer/shared/ui/dom/dom-utils.js';
import type { DialogContent } from 'sparklet/renderer/shared/updater/dialog/updater-dialog-types.js';
import { startRestartCountdown } from 'sparklet/renderer/shared/updater/dialog/updater-dialog-countdown.js';

// ========== 3. Restart confirmation (two buttons + 30s timeout countdown) [重启确认 (双按钮 + 30s 超时倒计时)] ==========
export function buildRestartConfirm(params: Record<string, unknown>, timeoutMs: number): DialogContent {
  const title = t('dialog.restartConfirm.title');
  const bodyHtml = `
        <div class="upd-info-row"><b>${t('dialog.restartConfirm.version')}:</b> ${escapeHtml(params.targetVersion)}</div>
        <div class="upd-info-row"><b>${t('dialog.restartConfirm.codename')}:</b> ${escapeHtml(params.codename)}</div>
        <div class="upd-info-row"><b>${t('dialog.restartConfirm.releaseDate')}:</b> ${escapeHtml(params.releaseDate)}</div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.restartConfirm.ask')}</div>
        <div id="restartCountdown" class="upd-info-row" style="margin-top:8px;color:#666;font-size:13px;"></div>
      `;
  const buttons = [
    { index: 1, label: t('dialog.restartConfirm.btnLater'), style: 'cancel' as const },
    { index: 0, label: t('dialog.restartConfirm.btnRestart'), style: 'ok' as const },
  ];

  // 30s countdown display [30s 倒计时显示]
  startRestartCountdown(timeoutMs);

  return { title, bodyHtml, buttons };
}
