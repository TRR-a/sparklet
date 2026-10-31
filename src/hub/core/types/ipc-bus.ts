// Generic IPC bus contract exposed by the core preload [核心 preload 暴露的通用 IPC 总线契约]
// The core knows nothing about module-specific channels; modules call through this bus [核心不感知任何模块专属通道；模块统一经此总线调用]

/**
 * Generic bidirectional IPC bus [通用双向 IPC 总线]
 */
export interface IpcBus {
  /**
   * Request-response call (ipcRenderer.invoke) [请求-响应调用]
   * @param channel IPC channel name [IPC 通道名]
   * @param args Arguments [参数]
   * @returns Response promise [响应 Promise]
   */
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;

  /**
   * One-way message (ipcRenderer.send) [单向消息]
   * @param channel IPC channel name [IPC 通道名]
   * @param args Arguments [参数]
   */
  send(channel: string, ...args: unknown[]): void;

  /**
   * Subscribe to a main-process push event [订阅主进程推送事件]
   * @param channel IPC channel name [IPC 通道名]
   * @param callback Event callback [事件回调]
   * @returns Unsubscribe function [取消订阅函数]
   */
  on(channel: string, callback: (...args: unknown[]) => void): () => void;
}
