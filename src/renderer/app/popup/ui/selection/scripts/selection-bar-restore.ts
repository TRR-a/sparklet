// Selection bar: restore action [多选栏 - 恢复]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { exitSelectionMode } from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-state.js';
import { refreshCurrentView } from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-bar-refresh.js';

/** Restore the selected notes from trash [从回收站恢复选中笔记] */
export async function runSelectionRestore(ids: string[]): Promise<void> {
  await storageManager.restoreNotes(ids);
  await refreshCurrentView();
  exitSelectionMode();
}
