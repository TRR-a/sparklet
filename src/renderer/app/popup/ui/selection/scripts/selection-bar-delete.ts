// Selection bar: delete-to-trash action [多选栏 - 删除到回收站]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showCustomConfirm } from 'sparklet/renderer/shared/ui/dialog/custom-dialog.js';
import { exitSelectionMode } from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-state.js';
import { refreshCurrentView } from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-bar-refresh.js';

/** Confirm and move the selected notes to trash [确认并把选中笔记移入回收站] */
export async function runSelectionDelete(ids: string[]): Promise<void> {
  const confirmed = await showCustomConfirm({
    title: t('selection.confirmDeleteTitle'),
    message: t('selection.confirmDeleteMessage').replace('{n}', String(ids.length)),
    okText: t('selection.deleteToTrash'),
    cancelText: t('confirm.default.cancel'),
  });
  if (!confirmed) return;
  await storageManager.deleteNotes(ids);
  await refreshCurrentView();
  exitSelectionMode();
}
