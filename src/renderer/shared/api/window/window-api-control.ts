// Window API: current window controls [窗口 API - 当前窗口控制]

import { bus } from 'sparklet/renderer/shared/ipc/ipc-bus.js';

export const windowApiControl = {
  // ---------- Current window controls [当前窗口控制] ----------
  minimize(): Promise<unknown> {
    return bus.invoke('window-minimize');
  },
  maximize(): Promise<unknown> {
    return bus.invoke('window-maximize');
  },
  close(): Promise<unknown> {
    return bus.invoke('window-close');
  },
  /** Quit the whole app (used by exit-confirm dialog after saving) [退出整个应用 (退出确认弹窗保存后调用)] */
  quitApp(): Promise<unknown> {
    return bus.invoke('app-quit');
  },
  /** Toggle always-on-top, returns the new pinned state [切换窗口置顶，返回新的置顶状态] */
  toggleAlwaysOnTop(): Promise<boolean> {
    return bus.invoke<boolean>('window-toggle-always-on-top');
  },
  /** Get runtime Electron/Node.js/Chromium versions (about panel) [获取运行时 Electron/Node.js/Chromium 版本 (关于面板)] */
  getRuntimeVersions(): Promise<{ electron: string; node: string; chrome: string }> {
    return bus.invoke<{ electron: string; node: string; chrome: string }>('get-runtime-versions');
  },
};
