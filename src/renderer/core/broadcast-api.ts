// Core cross-window broadcast API (renderer side) [核心跨窗口广播 API (渲染侧)]
// Theme/language/config changes are relayed by the main process to every window [主题/语言/配置变化由主进程中转广播到所有窗口]

import { bus } from './ipc-bus.js';
import type { UpdaterConfig } from '../../shared/types/updater.js';

export const broadcastApi = {
  // ---------- Theme [主题] ----------
  /** Notify main process that theme changed (it rebroadcasts to all windows) [通知主进程主题已变 (由其广播到全部窗口)] */
  notifyThemeChanged(theme: string): Promise<unknown> {
    return bus.invoke('theme-changed', theme);
  },
  onThemeBroadcast(callback: (theme: unknown) => void): () => void {
    return bus.on('theme-broadcast', (theme: unknown) => callback(theme));
  },

  // ---------- Language [语言] ----------
  notifyLanguageChanged(lang: string): Promise<unknown> {
    return bus.invoke('language-changed', lang);
  },
  onLanguageBroadcast(callback: (lang: unknown) => void): () => void {
    return bus.on('language-broadcast', (lang: unknown) => callback(lang));
  },

  // ---------- Updater config changes [更新配置变化] ----------
  onConfigChanged(callback: (config: UpdaterConfig) => void): () => void {
    return bus.on('config:changed', (config) => callback(config as UpdaterConfig));
  },
};
