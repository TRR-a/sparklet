// App lifecycle: window/app events [应用生命周期 - 窗口与应用事件]

import { app } from 'electron';
import { createWelcomeWindow } from 'sparklet/main/windows/welcome-window.js';
import { getWelcomeWindow } from 'sparklet/main/windows/window-manager.js';

/**
 * Application lifecycle: window-all-closed [应用生命周期：所有窗口关闭]
 */
export function registerWindowClosedLifecycle(): void {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

/**
 * Application lifecycle: activate (macOS) [应用生命周期：激活 (macOS)]
 */
export function registerActivateLifecycle(): void {
  app.on('activate', () => {
    if (getWelcomeWindow() === null) {
      createWelcomeWindow();
    }
  });
}
