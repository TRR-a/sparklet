// Kernel settings window: window controls (bind FIRST, synchronously) [内核设置窗口 - 窗口控制 (最先同步绑定)]

import { windowApi } from 'sparklet/renderer/shared/index.js';

// ========== Window controls (bind FIRST, synchronously) ==========
// [窗口控制（最先同步绑定，防止后续异步错误导致红绿灯失效）]
export function bindWindowControls(): void {
  document.getElementById('closeBtn')?.addEventListener('click', () => void windowApi.close());
  document.getElementById('minimizeBtn')?.addEventListener('click', () => void windowApi.minimize());
}
