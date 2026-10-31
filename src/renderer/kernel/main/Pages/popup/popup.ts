// Popup page - official Main UI (shell only, UI pending rewrite)
// [官方 Main 模块 - 仅保留外壳，UI 待重写]

import { initI18n } from 'sparklet/renderer/kernel/main/Modules/i18n.js';
import { setTheme } from 'sparklet/renderer/kernel/main/Base/theme.js';
import { storeApi } from 'sparklet/renderer/core/index.js';

async function initApp(): Promise<void> {
  await initI18n();

  // Read initial theme from store [从存储读取初始主题]
  const theme = await storeApi.get<string>('theme');
  setTheme(theme || 'light');

  // Listen for theme changes from parent kernel window
  // [监听父窗口内核发来的主题切换消息]
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'theme-changed') {
      setTheme(e.data.theme);
    }
  });
}

document.addEventListener('DOMContentLoaded', initApp);
