// Settings: window controls [设置 - 窗口控制]

import { windowApi } from 'sparklet/renderer/shared/index.js';

/** Bind window minimize / close buttons [绑定窗口最小化/关闭按钮] */
export function bindWindowControl(): void {
  // ==================== Window control [窗口控制] ==========
  const minimizeBtn = document.querySelector('.window-btn.minimize');
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      void windowApi.minimize();
    });
  }

  const closeBtn = document.querySelector('.window-btn.close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      void windowApi.close();
    });
  }
}
