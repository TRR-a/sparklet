// Global type declarations for renderer [渲染进程全局类型声明]
import type { IpcBus } from '../../../src/shared/types/ipc-bus';

declare global {
  interface Window {
    // Single generic IPC bus exposed by the core preload [核心 preload 暴露的唯一通用 IPC 总线]
    sparklet: IpcBus;
  }
}

export {};
