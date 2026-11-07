// Settings window: load persisted preferences [设置窗口 - 加载已保存偏好]

import { storeApi, windowApi, APP_VERSION } from 'sparklet/renderer/shared/index.js';
import { t, getLang, setLang, applyI18n } from './welcome-settings-i18n.js';
import { setCustomSelectValue } from './welcome-settings-select.js';

/** Apply language, theme, clock format and about versions from the store [从存储应用语言、主题、时钟制式与关于版本] */
export async function loadSavedSettings(): Promise<HTMLInputElement | null> {
  // Language
  const savedLang = await storeApi.get<string>('language');
  setLang(savedLang);
  applyI18n();

  // Theme
  const theme = (await storeApi.get<string>('theme')) || 'light';
  document.body.dataset.theme = theme;
  setCustomSelectValue('themeSelect', theme, t(`kernel.theme${theme.charAt(0).toUpperCase() + theme.slice(1)}`));

  // Clock format
  const use12Hour = (await storeApi.get<boolean>('clock12Hour')) === true;
  const clockToggle = document.getElementById('clock12hToggle') as HTMLInputElement | null;
  if (clockToggle) clockToggle.checked = use12Hour;

  // Language select
  setCustomSelectValue('languageSelect', getLang(), getLang() === 'zh-CN' ? '简体中文' : 'English');

  // About versions (all optional [全部可选])
  const appVer = document.getElementById('appVersion');
  if (appVer) appVer.textContent = `v${APP_VERSION}`;
  try {
    const versions = await windowApi.getRuntimeVersions();
    const e = document.getElementById('electronVersion');
    const n = document.getElementById('nodeVersion');
    const c = document.getElementById('chromeVersion');
    if (e) e.textContent = versions.electron;
    if (n) n.textContent = versions.node;
    if (c) c.textContent = versions.chrome || 'N/A';
  } catch { /* version info optional [版本信息失败不阻塞] */ }

  return clockToggle;
}
