// About page logic [关于页面逻辑]
// Loads theme + i18n, binds close button [加载主题 + i18n，绑定关闭按钮]

import { loadTheme, bindThemeBroadcastListener } from '../../Base/theme';
import { initI18n } from '../../Modules/i18n';

/**
 * Load theme and initialize i18n [加载主题并初始化 i18n]
 */
async function loadThemeAndI18n(): Promise<void> {
  await loadTheme();
  await initI18n();
  bindThemeBroadcastListener();
}

document.addEventListener('DOMContentLoaded', loadThemeAndI18n);

// Close button [关闭按钮]
const closeBtn = document.querySelector('.window-btn.close');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    window.close();
  });
}
