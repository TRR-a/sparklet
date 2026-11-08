// Storage manager: maintenance methods [存储管理器 - 维护方法]

import type { NoteMeta } from 'sparklet/shared/types/note/notes.js';
import { refresh, debug } from 'sparklet/renderer/shared/storage/storage-maintenance.js';

/** Maintenance methods of the storage facade [存储外观层的维护方法] */
export const storageManagerMaintenance = {
  /** Refresh cache (exposed for settings page / manual refresh) [刷新缓存 (对外暴露，设置页/手动刷新用)] */
  async refresh(): Promise<NoteMeta[] | null> {
    return refresh();
  },

  /** Debug utility [调试] */
  async debug(): Promise<NoteMeta[] | null> {
    return debug();
  },
};
