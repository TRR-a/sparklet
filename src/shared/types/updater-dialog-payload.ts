// Updater dialog / toast payload types [更新器弹窗与 Toast 负载类型]

/** Toast message data [Toast 消息数据] */
export interface ToastData {
  message: string | { key: string; params?: Record<string, string> };
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}

/** Updater dialog payload [更新器弹窗负载] */
export interface DialogPayload {
  dialogId: string;
  dialogType: string;
  params: Record<string, unknown>;
  timeoutMs: number;
}

/** Updater dialog response [更新器弹窗响应] */
export interface DialogResponse {
  buttonIndex: number;
  timedOut?: boolean;
}
