// Update module shared state [更新模块共享状态]

import type { PendingUpdateInfo } from './rollback';

/** Mutable shared state for updater modules [更新模块可变共享状态] */
export const updaterStateInternal = {
  isUpdating: false,
  pendingUpdate: null as PendingUpdateInfo | null,
  updateDisabled: false,
  checkTimer: null as NodeJS.Timeout | null,
  isChecking: false,
};
