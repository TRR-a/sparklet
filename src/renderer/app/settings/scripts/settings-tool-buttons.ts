// Settings: tool buttons [设置 - 工具按钮]

import { showToast } from 'sparklet/renderer/shared/ui/toast.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { windowApi, appApi } from 'sparklet/renderer/shared/index.js';

/** Bind DevTools / About / Official Site tool buttons [绑定开发者工具/关于/官网按钮] */
export function bindToolButtons(): void {
  // ==================== Tool buttons [工具按钮] ==========
  const openDevToolsBtn = document.getElementById('openDevToolsBtn');
  if (openDevToolsBtn) {
    openDevToolsBtn.addEventListener('click', () => {
      void windowApi.openDevTools();
    });
  }

  const openAboutBtn = document.getElementById('openAboutBtn');
  if (openAboutBtn) {
    openAboutBtn.addEventListener('click', () => {
      void windowApi.openAbout();
    });
  }

  const openOfficialSiteBtn = document.getElementById('openOfficialSiteBtn');
  if (openOfficialSiteBtn) {
    openOfficialSiteBtn.addEventListener('click', async () => {
      try {
        const result = await appApi.openOfficialSite();
        if (!result || !result.success) {
          showToast(t('settings.toast.openSiteFailed'));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('打开官网失败:', msg);
        showToast(t('settings.toast.openSiteFailed'));
      }
    });
  }
}
