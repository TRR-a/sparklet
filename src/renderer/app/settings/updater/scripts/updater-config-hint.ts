// Settings: updater version hint text [设置 - 更新器版本提示文本]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { appApi } from 'sparklet/renderer/shared/index.js';

/**
 * Load update hint text (replaces version placeholder) [加载更新提示 (替换版本号占位符)]
 */
export async function loadUpdateHint(): Promise<void> {
  try {
    const version = await appApi.getVersion();
    const hint = t('settings.updateHint');
    const updateHintEl = document.getElementById('updateHint');
    if (updateHintEl) {
      updateHintEl.textContent = hint.replace('{version}', `v${version}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('加载更新提示失败:', msg);
  }
}
