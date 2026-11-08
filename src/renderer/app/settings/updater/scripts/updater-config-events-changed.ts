// Settings: react to external config changes [设置 - 响应外部配置变更]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast/toast.js';
import type { UpdaterConfig } from 'sparklet/shared/types/updater/updater.js';
import { broadcastApi } from 'sparklet/renderer/shared/index.js';
import { setUpdaterConfig } from 'sparklet/renderer/app/settings/updater/scripts/updater-config-state.js';
import { loadUpdaterConfig } from 'sparklet/renderer/app/settings/updater/scripts/updater-config-load.js';

/** Reload the section when the config file changes externally [配置被外部修改后重载整个区块] */
export function bindUpdaterConfigChanged(): void {
  // Listen for config changes (auto refresh when config file modified externally) [监听配置变化 (手动修改配置文件后自动刷新)]
  broadcastApi.onConfigChanged(async (config: UpdaterConfig) => {
    console.log('[Settings] Config changed externally, reloading...');
    setUpdaterConfig(config);
    await loadUpdaterConfig();
    showToast(t('settings.toast.configUpdated'), 'info', 3000);
  });
}
