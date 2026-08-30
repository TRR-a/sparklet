// About page logic [关于页面逻辑]
// Loads theme + i18n, fills version info, binds close button [加载主题 + i18n，填充版本信息，绑定关闭按钮]

import { loadTheme, bindThemeBroadcastListener } from '../../Base/theme.js';
import { initI18n, t } from '../../Modules/i18n.js';
import { windowApi, APP_VERSION, APP_CODENAME } from '../../../../src/renderer/core/index.js';

/**
 * Fill version info: app version/codename from generated constants (source:
 * version.json), Electron/Node.js from runtime IPC [填充版本信息：应用版本/代号来自
 * 生成的常量 (源头 version.json)，Electron/Node.js 来自运行时 IPC]
 */
async function fillVersionInfo(): Promise<void> {
  const versionEl = document.querySelector<HTMLElement>('.version');
  if (versionEl) versionEl.textContent = t('about.version', { version: APP_VERSION });

  const codenameEl = document.querySelector<HTMLElement>('.internal-version');
  if (codenameEl) codenameEl.textContent = t('about.internalVersion', { codename: APP_CODENAME });

  const electronEl = document.getElementById('electronVersion');
  const nodeEl = document.getElementById('nodeVersion');
  if (electronEl || nodeEl) {
    try {
      const versions = await windowApi.getRuntimeVersions();
      if (electronEl) electronEl.textContent = `Electron: ${versions.electron}`;
      if (nodeEl) nodeEl.textContent = `Node.js: ${versions.node}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[About] Failed to get runtime versions:', msg);
    }
  }
}

/**
 * Load theme and initialize i18n [加载主题并初始化 i18n]
 */
async function loadThemeAndI18n(): Promise<void> {
  await loadTheme();
  await initI18n();
  bindThemeBroadcastListener();
  await fillVersionInfo();
}

document.addEventListener('DOMContentLoaded', loadThemeAndI18n);

// Close button [关闭按钮]
const closeBtn = document.querySelector('.window-btn.close');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    window.close();
  });
}
