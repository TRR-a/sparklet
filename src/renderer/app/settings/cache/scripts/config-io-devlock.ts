// Config IO: dev-environment lock [配置导入导出 - 开发环境锁定]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { getIsDevEnvironment } from '../../updater/scripts/updater-config.js';

/**
 * Apply dev environment lock to import/export buttons [应用开发环境锁定到导入/导出按钮]
 */
export function applyImportExportDevLock(): void {
  const exportBtn = document.getElementById('exportUpdaterConfigBtn') as HTMLButtonElement | null;
  const importBtn = document.getElementById('importUpdaterConfigBtn') as HTMLButtonElement | null;
  if (!exportBtn || !importBtn) return;

  if (getIsDevEnvironment()) {
    exportBtn.disabled = true;
    (exportBtn as HTMLElement).title = t('settings.devLock.ioBtnTitle');
    exportBtn.textContent = t('settings.devLock.exportBtn');
    (exportBtn as HTMLElement).style.opacity = '0.75';

    importBtn.disabled = true;
    (importBtn as HTMLElement).title = t('settings.devLock.ioBtnTitle');
    importBtn.textContent = t('settings.devLock.importBtn');
    (importBtn as HTMLElement).style.opacity = '0.75';
  } else {
    exportBtn.disabled = false;
    (exportBtn as HTMLElement).title = '';
    exportBtn.textContent = t('settings.configIO.exportBtn');
    (exportBtn as HTMLElement).style.opacity = '';

    importBtn.disabled = false;
    (importBtn as HTMLElement).title = '';
    importBtn.textContent = t('settings.configIO.importBtn');
    (importBtn as HTMLElement).style.opacity = '';
  }
}
