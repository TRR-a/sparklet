// Updater API: events & dialog channel [更新 API - 事件与弹窗通道]

import { bus } from '../../ipc/ipc-bus.js';
import type { ToastData, DialogPayload } from 'sparklet/shared/types/updater/updater.js';

export const updaterApiEvents = {
  // ---------- Update events [更新事件] ----------
  onStatusChange(callback: (data: { checking?: boolean; done?: boolean; error?: string }) => void): () => void {
    return bus.on('updater:status-change', (data) => callback(data as { checking?: boolean; done?: boolean; error?: string }));
  },
  onProgress(callback: (data: { msg?: string; percent?: number }) => void): () => void {
    return bus.on('updater:progress', (data) => callback(data as { msg?: string; percent?: number }));
  },

  // ---------- Custom updater dialog [自定义更新弹窗] ----------
  onDialogShow(callback: (payload: DialogPayload) => void): () => void {
    return bus.on('updater:dialog-show', (payload) => callback(payload as DialogPayload));
  },
  sendDialogResponse(dialogId: string, response: { buttonIndex: number;[key: string]: unknown }): Promise<{ ok: boolean }> {
    return bus.invoke('updater:dialog-response', { dialogId, response });
  },

  // ---------- Toast [Toast 提示] ----------
  onToastShow(callback: (data: ToastData) => void): () => void {
    return bus.on('toast:show', (data) => callback(data as ToastData));
  },
};
