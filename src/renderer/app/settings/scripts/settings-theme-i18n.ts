// Settings window: theme + i18n bootstrap [设置窗口 - 主题与 i18n 引导]

import { initI18n } from 'sparklet/renderer/shared/i18n/i18n.js';
import { loadTheme, bindThemeBroadcastListener } from 'sparklet/renderer/shared/ui/theme.js';
import { broadcastApi } from 'sparklet/renderer/shared/index.js';
import { loadUpdateHint } from 'sparklet/renderer/app/settings/updater/scripts/updater-config.js';

/**
 * Load theme and initialize i18n [加载主题并初始化 i18n]
 */
export async function loadThemeAndI18n(): Promise<void> {
  const currentTheme = await loadTheme();
  const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement | null;
  if (themeSelect) themeSelect.value = currentTheme;

  const currentLang = await initI18n();
  const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement | null;
  if (languageSelect) languageSelect.value = currentLang;
  await loadUpdateHint();
  bindThemeBroadcastListener();

  // Also sync the theme dropdown when receiving broadcasts from other windows
  // [接收其他窗口的主题广播时，同步下拉框显示]
  broadcastApi.onThemeBroadcast((theme: unknown) => {
    const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement | null;
    if (themeSelect && themeSelect.value !== theme) {
      themeSelect.value = theme as string;
      themeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}
