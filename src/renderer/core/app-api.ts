// Core application API (renderer side) [核心应用 API (渲染侧)]
// Version, dev-mode detection and official-site link [版本、开发环境检测与官网链接]

import { bus } from './ipc-bus.js';

export const appApi = {
  /** Whether the app is running in dev mode [是否运行于开发模式] */
  isDev(): Promise<boolean> {
    return bus.invoke<boolean>('updater:is-dev');
  },

  /** Application version string [应用版本号] */
  getVersion(): Promise<string> {
    return bus.invoke<string>('app:get-version');
  },

  /** Open the official website [打开官网] */
  openOfficialSite(): Promise<{ success: boolean; error?: string }> {
    return bus.invoke('app:open-official-site');
  },
};
