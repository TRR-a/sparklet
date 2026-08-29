// Core window-control API (renderer side) [核心窗口控制 API (渲染侧)]
// Wraps window control, secondary-window management and their push events [封装窗口控制、副窗口管理及其推送事件]

import { bus } from './ipc-bus';

export const windowApi = {
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
  /** Toggle always-on-top, returns the new pinned state [切换窗口置顶，返回新的置顶状态] */
  toggleAlwaysOnTop(): Promise<boolean> {
    return bus.invoke<boolean>('window-toggle-always-on-top');
  },

  // ---------- Secondary windows [副窗口] ----------
  openSettings(): Promise<unknown> {
    return bus.invoke('open-settings-window');
  },
  isSettingsOpen(): Promise<boolean> {
    return bus.invoke<boolean>('is-settings-window-open');
  },
  openAbout(): Promise<unknown> {
    return bus.invoke('open-about-window');
  },
  openDevTools(): Promise<unknown> {
    return bus.invoke('open-dev-tools-window');
  },
  /** Open an external URL through the main process [经主进程打开外部链接] */
  openExternal(url: string): Promise<unknown> {
    return bus.invoke('app:open-external', url);
  },

  // ---------- Settings window push events [设置窗口推送事件] ----------
  onSettingsMoved(callback: (...args: unknown[]) => void): () => void {
    return bus.on('settings-window-moved', callback);
  },
  onSettingsOverlap(callback: (...args: unknown[]) => void): () => void {
    return bus.on('settings-window-overlap', callback);
  },
  onSettingsClosed(callback: () => void): () => void {
    return bus.on('settings-window-closed', callback);
  },
  onSettingsMinimized(callback: () => void): () => void {
    return bus.on('settings-window-minimized', callback);
  },
  onSettingsRestored(callback: () => void): () => void {
    return bus.on('settings-window-restored', callback);
  },
};
