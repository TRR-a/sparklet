// Toast: shared types [Toast - 共享类型]

/** Toast type [Toast 类型] */
export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'danger';

/** Toast data received from main process [从主进程接收的 Toast 数据] */
export interface ToastEventData {
  message: string | { key: string; params?: Record<string, string> };
  type: ToastType;
  duration: number;
}
