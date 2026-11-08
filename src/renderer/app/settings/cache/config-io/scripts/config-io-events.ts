// Config IO: event binding [配置导入导出 - 事件绑定]

import { handleExportUpdaterConfig } from 'sparklet/renderer/app/settings/cache/config-io/scripts/config-io-export.js';
import { handleImportUpdaterConfig } from 'sparklet/renderer/app/settings/cache/config-io/scripts/config-io-import.js';

/**
 * Bind import/export event listeners [绑定导入/导出事件监听]
 */
export function bindImportExportEvents(): void {
  const exportBtn = document.getElementById('exportUpdaterConfigBtn');
  const importBtn = document.getElementById('importUpdaterConfigBtn');
  if (exportBtn) exportBtn.addEventListener('click', handleExportUpdaterConfig);
  if (importBtn) importBtn.addEventListener('click', handleImportUpdaterConfig);
}
