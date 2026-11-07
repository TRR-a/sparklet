// Window API: secondary windows & links [窗口 API - 副窗口与外链]

import { bus } from '../ipc/ipc-bus.js';

export const windowApiSecondary = {
  // ---------- Secondary windows [副窗口] ----------
  openSettings(): Promise<unknown> {
    return bus.invoke('open-settings-window');
  },
  isSettingsOpen(): Promise<boolean> {
    return bus.invoke<boolean>('is-settings-window-open');
  },
  /** Open the hub-level settings window [打开 Hub 级设置窗口] */
  openWelcomeSettings(): Promise<unknown> {
    return bus.invoke('open-welcome-settings-window');
  },
  openAbout(): Promise<unknown> {
    return bus.invoke('open-about-window');
  },
  /** Open the official Main window [打开官方 Main 窗口] */
  openMainWindow(): Promise<unknown> {
    return bus.invoke('open-main-window');
  },
  openDevTools(): Promise<unknown> {
    return bus.invoke('open-dev-tools-window');
  },
  /** Open an external URL through the main process [经主进程打开外部链接] */
  openExternal(url: string): Promise<unknown> {
    return bus.invoke('app:open-external', url);
  },
};
