// Settings: config import/export section - handles config file backup and restore [设置：配置导入导出区域 - 处理配置文件备份和还原]
// Dev environment locks import/export buttons (only writes user config in production) [开发环境下锁定导入/导出按钮 (真实环境才写入用户实际配置)]

import { t } from '../../Modules/i18n.js';
import { showToast } from '../../Base/toast.js';
import { showCustomConfirm } from '../../Modules/custom-dialog.js';
import { getIsDevEnvironment, loadUpdaterConfig } from './updater-config.js';
import { loadCacheRetentionDays, applyCacheDevLock, loadCacheInfo } from './cache-settings.js';
import { updaterApi } from '../../../../src/renderer/core/index.js';

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

/**
 * Handle export updater config button click [处理导出更新配置按钮点击]
 */
export async function handleExportUpdaterConfig(): Promise<void> {
  if (!window.sparklet) {
    showToast(t('settings.toast.exportUnsupported'));
    return;
  }
  try {
    const result = await updaterApi.exportConfig();
    if (!result) {
      showToast(t('settings.toast.exportFailed'));
      return;
    }
    if (result.canceled) return; // User clicked cancel, no prompt [用户点了取消，不提示]
    if (result.success && result.filePath) {
      const name = (result.filePath.match(/[^\\/]+$/) || [])[0] || result.filePath;
      showToast(t('settings.toast.exportSuccess').replace('{name}', name));
    } else if (result.error) {
      showToast(t('settings.toast.exportFailedPrefix') + result.error);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('导出更新配置失败:', msg);
    showToast(t('settings.toast.exportFailed'));
  }
}

/**
 * Handle import updater config button click [处理导入更新配置按钮点击]
 */
export async function handleImportUpdaterConfig(): Promise<void> {
  if (!window.sparklet) {
    showToast(t('settings.toast.importUnsupported'));
    return;
  }

  // Second confirmation (avoid accidental overwrite of existing settings) [先二次确认 (避免误点覆盖现有设置)]
  const ok = await showCustomConfirm({
    title: t('confirm.importConfig.title'),
    message: t('confirm.importConfig.message'),
    okText: t('confirm.importConfig.ok'),
    cancelText: t('confirm.default.cancel'),
    okDanger: false
  });
  if (!ok) return;

  try {
    const result = await updaterApi.importConfig();
    if (!result) {
      showToast(t('settings.toast.importFailed'));
      return;
    }
    if (result.canceled) return; // User canceled file selection [用户取消选文件]

    if (result.success && result.config) {
      // Import success: reload all controls to ensure UI matches config [导入成功：重新加载整页所有控件，保证 UI 与配置一致]
      await Promise.all([
        loadUpdaterConfig(),
        loadCacheRetentionDays()
      ]);
      applyImportExportDevLock();
      applyCacheDevLock();
      await loadCacheInfo();
      showToast(t('settings.toast.importSuccess'));
    } else if (result.error) {
      showToast(t('settings.toast.importFailedPrefix') + result.error);
    } else {
      showToast(t('settings.toast.importFailed'));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('导入更新配置失败:', msg);
    showToast(t('settings.toast.importFailed'));
  }
}

/**
 * Bind import/export event listeners [绑定导入/导出事件监听]
 */
export function bindImportExportEvents(): void {
  const exportBtn = document.getElementById('exportUpdaterConfigBtn');
  const importBtn = document.getElementById('importUpdaterConfigBtn');
  if (exportBtn) exportBtn.addEventListener('click', handleExportUpdaterConfig);
  if (importBtn) importBtn.addEventListener('click', handleImportUpdaterConfig);
}
