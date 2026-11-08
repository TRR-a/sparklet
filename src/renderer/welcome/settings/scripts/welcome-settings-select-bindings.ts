// Settings window: select bindings [设置窗口 - 下拉绑定]

import { storeApi, broadcastApi } from 'sparklet/renderer/shared/index.js';
import { t, getLang, setLang, applyI18n } from 'sparklet/renderer/welcome/settings/scripts/welcome-settings-i18n.js';
import { setupCustomSelect, setCustomSelectValue } from 'sparklet/renderer/welcome/settings/scripts/welcome-settings-select.js';

/** Bind theme and language custom selects [绑定主题与语言自定义下拉] */
export function bindSettingsSelects(): void {
  // Theme select
  setupCustomSelect('themeSelect', async (value) => {
    document.body.dataset.theme = value;
    setCustomSelectValue('themeSelect', value, t(`kernel.theme${value.charAt(0).toUpperCase() + value.slice(1)}`));
    await storeApi.set('theme', value);
    broadcastApi.notifyThemeChanged(value);
  });

  // Language select
  setupCustomSelect('languageSelect', async (value) => {
    setLang(value);
    applyI18n();
    setCustomSelectValue('languageSelect', getLang(), getLang() === 'zh-CN' ? '简体中文' : 'English');
    // Refresh theme label after language change [语言变更后刷新主题标签]
    const curTheme = document.body.dataset.theme || 'light';
    setCustomSelectValue('themeSelect', curTheme, t(`kernel.theme${curTheme.charAt(0).toUpperCase() + curTheme.slice(1)}`));
    await storeApi.set('language', value);
    broadcastApi.notifyLanguageChanged(value);
  });
}

/** Bind the clock format toggle [绑定时钟制式开关] */
export function bindClockToggle(clockToggle: HTMLInputElement | null): void {
  // Clock format toggle
  clockToggle?.addEventListener('change', async () => {
    const enabled = clockToggle.checked;
    await storeApi.set('clock12Hour', enabled);
    broadcastApi.notifyClockFormatChanged(enabled);
  });
}
