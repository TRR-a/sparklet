// Core preload - exposes only a generic IPC bus to the renderer [核心预加载 - 仅向渲染进程暴露通用 IPC 总线]
// No module-specific API is hard-coded here; each module ships its own API wrapper on top of the bus [此处不再写死任何模块专属 API；各模块在总线之上自带 API 封装]
// Compiled with CommonJS (main process config) [使用 CommonJS 编译 (主进程配置)]

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// ========== Generic IPC bus (the only bridge exposed to renderers) [通用 IPC 总线 (唯一暴露给渲染进程的桥)] ==========
const ipcBus = {
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> =>
    ipcRenderer.invoke(channel, ...args),

  send: (channel: string, ...args: unknown[]): void => {
    ipcRenderer.send(channel, ...args);
  },

  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]): void => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
};

// Expose the single bus under a stable core namespace [在稳定的核心命名空间下暴露唯一总线]
contextBridge.exposeInMainWorld('sparklet', ipcBus);
