// Kernel settings window renderer [内核设置窗口渲染层]
// Standalone settings window for kernel-level preferences (theme, language,
// clock format), with an About panel and tools. Changes persist via storeApi
// and sync to every window via broadcastApi.
// [内核级偏好设置 (主题、语言、时钟制式) 的独立设置窗口，含关于面板与工具。
//  变更经 storeApi 持久化并通过 broadcastApi 同步到所有窗口]

import { storeApi, broadcastApi, windowApi, initCustomTooltip, APP_VERSION } from '../../core/index.js';

// ========== i18n ==========
const STRINGS: Record<string, Record<string, string>> = {
  en: {
    'kernel.settingsTitle': 'Kernel Settings',
    'kernel.settingsTheme': 'Theme',
    'kernel.themeLight': 'Light',
    'kernel.themeDark': 'Dark',
    'kernel.themeBlue': 'Blue',
    'kernel.use12HourClock': 'Use 12-hour clock',
    'kernel.settingsLanguage': 'Language',
    'kernel.about': 'About',
    'kernel.tools': 'Tools',
    'kernel.openOfficialSite': 'Official Site',
    'kernel.devTools': 'DevTools',
  },
  'zh-CN': {
    'kernel.settingsTitle': '内核设置',
    'kernel.settingsTheme': '主题',
    'kernel.themeLight': '浅色',
    'kernel.themeDark': '深色',
    'kernel.themeBlue': '蓝色',
    'kernel.use12HourClock': '使用 12 小时制时钟',
    'kernel.settingsLanguage': '语言',
    'kernel.about': '关于',
    'kernel.tools': '工具',
    'kernel.openOfficialSite': '官网',
    'kernel.devTools': '开发者工具',
  },
};

let currentLang = 'en';

function t(key: string): string {
  return STRINGS[currentLang]?.[key] ?? STRINGS.en[key] ?? key;
}

function applyI18n(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
}

// ========== Window controls (bind FIRST, synchronously) ==========
// [窗口控制（最先同步绑定，防止后续异步错误导致红绿灯失效）]
function bindWindowControls(): void {
  document.getElementById('closeBtn')?.addEventListener('click', () => void windowApi.close());
  document.getElementById('minimizeBtn')?.addEventListener('click', () => void windowApi.minimize());
}

// ========== Custom select component [自定义下拉框] ==========
function setupCustomSelect(
  containerId: string,
  onSelect: (value: string) => void,
): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  const trigger = container.querySelector<HTMLButtonElement>('.custom-select-trigger');
  const options = container.querySelectorAll<HTMLElement>('.custom-select-option');
  if (!trigger) return;

  const close = (): void => container.classList.remove('open');
  const open = (): void => {
    // Close all other open selects [关闭其他已打开的下拉框]
    document.querySelectorAll('.custom-select.open').forEach((el) => {
      if (el !== container) el.classList.remove('open');
    });
    container.classList.add('open');
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.contains('open') ? close() : open();
  });

  options.forEach((opt) => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = opt.dataset.value || '';
      options.forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      const label = container.querySelector('.custom-select-label');
      if (label) label.textContent = opt.textContent || '';
      container.dataset.value = value;
      close();
      onSelect(value);
    });
  });
}

/** Set a custom select's displayed value without triggering callback [设置下拉框显示值（不触发回调）] */
function setCustomSelectValue(containerId: string, value: string, label?: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.dataset.value = value;
  const selected = container.querySelector(`.custom-select-option[data-value="${value}"]`);
  container.querySelectorAll('.custom-select-option').forEach((o) => o.classList.remove('selected'));
  if (selected) selected.classList.add('selected');
  const labelEl = container.querySelector('.custom-select-label');
  if (labelEl) labelEl.textContent = label || selected?.textContent || '';
}

// Close dropdowns when clicking outside [点击外部关闭下拉框]
document.addEventListener('click', () => {
  document.querySelectorAll('.custom-select.open').forEach((el) => el.classList.remove('open'));
});

// ========== Init ==========
async function init(): Promise<void> {
  bindWindowControls();
  initCustomTooltip((key) => t(key));

  try {
    // Language
    const savedLang = await storeApi.get<string>('language');
    currentLang = savedLang === 'zh-CN' ? 'zh-CN' : 'en';
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
    setCustomSelectValue('languageSelect', currentLang, currentLang === 'zh-CN' ? '简体中文' : 'English');

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

    // Theme select
    setupCustomSelect('themeSelect', async (value) => {
      document.body.dataset.theme = value;
      setCustomSelectValue('themeSelect', value, t(`kernel.theme${value.charAt(0).toUpperCase() + value.slice(1)}`));
      await storeApi.set('theme', value);
      broadcastApi.notifyThemeChanged(value);
    });

    // Language select
    setupCustomSelect('languageSelect', async (value) => {
      currentLang = value === 'zh-CN' ? 'zh-CN' : 'en';
      applyI18n();
      // Refresh theme label after language change [语言变更后刷新主题标签]
      const curTheme = document.body.dataset.theme || 'light';
      setCustomSelectValue('themeSelect', curTheme, t(`kernel.theme${curTheme.charAt(0).toUpperCase() + curTheme.slice(1)}`));
      await storeApi.set('language', value);
      broadcastApi.notifyLanguageChanged(value);
    });

    // Clock format toggle
    clockToggle?.addEventListener('change', async () => {
      const enabled = clockToggle.checked;
      await storeApi.set('clock12Hour', enabled);
      broadcastApi.notifyClockFormatChanged(enabled);
    });

    // Tools
    document.getElementById('openOfficialSiteBtn')?.addEventListener('click', () => {
      void windowApi.openExternal('https://github.com/TRR-a/sparklet');
    });
    document.getElementById('openDevToolsBtn')?.addEventListener('click', () => {
      void windowApi.openDevTools();
    });

    // Broadcast: stay in sync with other windows
    broadcastApi.onThemeBroadcast((value: unknown) => {
      const v = (value as string) || 'light';
      document.body.dataset.theme = v;
      setCustomSelectValue('themeSelect', v, t(`kernel.theme${v.charAt(0).toUpperCase() + v.slice(1)}`));
    });
    broadcastApi.onLanguageBroadcast((value: unknown) => {
      currentLang = (value as string) === 'zh-CN' ? 'zh-CN' : 'en';
      applyI18n();
      setCustomSelectValue('languageSelect', currentLang, currentLang === 'zh-CN' ? '简体中文' : 'English');
      const curTheme = document.body.dataset.theme || 'light';
      setCustomSelectValue('themeSelect', curTheme, t(`kernel.theme${curTheme.charAt(0).toUpperCase() + curTheme.slice(1)}`));
    });
    broadcastApi.onClockFormatBroadcast((value: unknown) => {
      if (clockToggle) clockToggle.checked = Boolean(value);
    });
  } catch (err) {
    console.error('[KernelSettings] init error:', err);
  }
}

void init();
