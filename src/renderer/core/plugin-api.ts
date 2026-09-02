// Core plugin API (kernel renderer side) [核心插件 API (内核渲染侧)]
// The kernel UI lists installed plugins and opens their main windows through
// these channels. No plugin-specific code lives here — it is pure discovery.
// [内核 UI 通过这些通道列出已安装插件并打开其主窗口。此处无插件专属代码——纯发现]

import { bus } from './ipc-bus.js';
import type { PluginDescriptor } from '../../shared/types/plugins.js';

export const pluginsApi = {
  /** List detected plugins (empty when none installed) [列出已检测插件 (未安装时为空)] */
  list(): Promise<PluginDescriptor[]> {
    return bus.invoke<PluginDescriptor[]>('plugins:list');
  },

  /** Open a plugin's main window by id [按 id 打开插件主窗口] */
  open(id: string): Promise<unknown> {
    return bus.invoke('plugins:open', id);
  },

  /** Whether a plugin's main window is currently open [插件主窗口当前是否打开] */
  isOpen(id: string): Promise<boolean> {
    return bus.invoke<boolean>('plugins:is-open', id);
  },
};
