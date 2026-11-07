// Settings window: cross-window broadcast sync [设置窗口 - 跨窗口广播同步]

import { broadcastApi } from 'sparklet/renderer/shared/index.js';
import { t, getLang, setLang, applyI18n } from './welcome-settings-i18n.js';
import { setCustomSelectValue } from './welcome-settings-select.js';

/** Subscribe to theme/language/clock broadcasts [订阅主题/语言/时钟广播] */
export function bindBroadcastSync(clockToggle: HTMLInputElement | null): void {
  // Broadcast: stay in sync with other windows
  broadcastApi.onThemeBroadcast((value: unknown) => {
    const v = (value as string) || 'light';
    document.body.dataset.theme = v;
    setCustomSelectValue('themeSelect', v, t(`kernel.theme${v.charAt(0).toUpperCase() + v.slice(1)}`));
  });
  broadcastApi.onLanguageBroadcast((value: unknown) => {
    setLang(value);
    applyI18n();
    setCustomSelectValue('languageSelect', getLang(), getLang() === 'zh-CN' ? '简体中文' : 'English');
    const curTheme = document.body.dataset.theme || 'light';
    setCustomSelectValue('themeSelect', curTheme, t(`kernel.theme${curTheme.charAt(0).toUpperCase() + curTheme.slice(1)}`));
  });
  broadcastApi.onClockFormatBroadcast((value: unknown) => {
    if (clockToggle) clockToggle.checked = Boolean(value);
  });
}
