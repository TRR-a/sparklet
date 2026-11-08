// Window API: settings window push events [窗口 API - 设置窗口推送事件]

import { bus } from '../../ipc/ipc-bus.js';

export const windowApiEvents = {
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
