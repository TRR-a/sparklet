// Settings: subscribe updater status/progress events [设置 - 订阅更新状态/进度事件]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { updaterApi } from 'sparklet/renderer/shared/index.js';
import { updateStatusText } from './updater-config-status.js';

/** Subscribe to check status changes [订阅检查状态变化] */
export function bindUpdaterStatusEvents(): void {
  updaterApi.onStatusChange((data: { checking?: boolean; done?: boolean; error?: string }) => {
    const btn = document.getElementById('checkNowBtn') as HTMLButtonElement | null;
    if (data.checking) {
      if (btn) { btn.disabled = true; btn.textContent = t('settings.status.checking'); }
      updateStatusText(t('settings.status.checkingUpdate'));
    } else if (data.done) {
      if (btn) { btn.disabled = false; btn.textContent = t('settings.checkNow'); }
      updateStatusText(t('settings.status.checkDone'));
      setTimeout(() => updateStatusText(t('settings.status.ready')), 3000);
    } else if (data.error) {
      if (btn) { btn.disabled = false; btn.textContent = t('settings.checkNow'); }
      updateStatusText(t('settings.status.checkFailedPrefix') + data.error, true);
      setTimeout(() => updateStatusText(t('settings.status.ready')), 5000);
    }
  });

  updaterApi.onProgress((data: { msg?: string; percent?: number }) => {
    if (data.msg) {
      updateStatusText(data.msg + (data.percent !== undefined ? ` (${data.percent}%)` : ''));
    }
  });
}
