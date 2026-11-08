// Welcome window controls [欢迎页窗口控制]

import { windowApi } from 'sparklet/renderer/shared/index.js';

// ========== Window controls [窗口控制] ==========
export function bindWindowControls(): void {
  document.querySelector('.window-btn.minimize')?.addEventListener('click', () => windowApi.minimize());
  document.querySelector('.window-btn.maximize')?.addEventListener('click', () => windowApi.maximize());
  document.querySelector('.window-btn.close')?.addEventListener('click', () => windowApi.close());
  document.getElementById('windowPinBtn')?.addEventListener('click', async () => {
    const pinned = await windowApi.toggleAlwaysOnTop();
    const btn = document.getElementById('windowPinBtn');
    if (btn) btn.style.opacity = pinned ? '1' : '0.45';
  });
}
