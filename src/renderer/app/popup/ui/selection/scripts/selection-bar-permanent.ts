// Selection bar: permanent delete action [多选栏 - 永久删除]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showCustomConfirm } from 'sparklet/renderer/shared/ui/dialog/custom-dialog.js';
import { exitSelectionMode } from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-state.js';
import { refreshCurrentView } from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-bar-refresh.js';

/** Confirm and permanently delete the selected notes [确认并永久删除选中笔记] */
export async function runSelectionPermanentDelete(ids: string[]): Promise<void> {
  const confirmed = await showCustomConfirm({
    title: t('selection.confirmPermanentTitle'),
    message: t('selection.confirmPermanentMessage').replace('{n}', String(ids.length)),
    okText: t('selection.permanentDelete'),
    cancelText: t('confirm.default.cancel'),
    okDanger: true,
  });
  if (!confirmed) return;
  await storageManager.permanentlyDeleteNotes(ids);
  await refreshCurrentView();
  exitSelectionMode();
}
