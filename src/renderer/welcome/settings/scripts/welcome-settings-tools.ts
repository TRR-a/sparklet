// Settings window: tool buttons [设置窗口 - 工具按钮]

import { windowApi } from 'sparklet/renderer/shared/index.js';

/** Bind the tools section buttons [绑定工具区按钮] */
export function bindToolButtons(): void {
  // Tools
  document.getElementById('openOfficialSiteBtn')?.addEventListener('click', () => {
    void windowApi.openExternal('https://github.com/TRR-a/sparklet');
  });
  document.getElementById('openDevToolsBtn')?.addEventListener('click', () => {
    void windowApi.openDevTools();
  });
  document.getElementById('openAboutBtn')?.addEventListener('click', () => {
    void windowApi.openAbout();
  });
}
