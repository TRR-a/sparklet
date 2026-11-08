// Updater API: update flow calls [更新 API - 更新流程调用]

import { bus } from '../../ipc/ipc-bus.js';

export const updaterApiFlow = {
  // ---------- Update flow [更新流程] ----------
  checkUpdate(): Promise<{ started: boolean }> {
    return bus.invoke('updater:check');
  },
  getUpdateStatus(): Promise<{ isUpdating: boolean }> {
    return bus.invoke('updater:status');
  },
  checkUpdateNow(): Promise<{ started: boolean }> {
    return bus.invoke('updater:check-now');
  },
  getUpdaterStatus(): Promise<{ isUpdating: boolean; isChecking: boolean; updateDisabled: boolean }> {
    return bus.invoke('updater:get-status');
  },
};
