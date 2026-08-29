// IPC bus singleton for renderer [渲染进程 IPC 总线单例]
// All core/module API wrappers talk to the main process through this object [所有核心/模块 API 封装均经此对象与主进程通信]

import type { IpcBus } from '../../shared/types/ipc-bus';

/**
 * Get the generic IPC bus exposed by the core preload [获取核心 preload 暴露的通用 IPC 总线]
 */
export const bus: IpcBus = window.sparklet;
