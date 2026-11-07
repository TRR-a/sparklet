// Selection bar actions: view detection, select-all ids, click dispatch [多选操作栏动作 - 视图判断、全选 ID、点击分发]
//
// Split out [已拆分]：view detection → selection-view-detect.ts,
// delete → selection-bar-delete.ts, restore → selection-bar-restore.ts,
// permanent delete → selection-bar-permanent.ts, refresh → selection-bar-refresh.ts.

import { getSelectedIds, selectAll, clearSelection, exitSelectionMode } from './selection-state.js';
import { allIdsInView } from './selection-view-detect.js';
import { runSelectionDelete } from './selection-bar-delete.js';
import { runSelectionRestore } from './selection-bar-restore.js';
import { runSelectionPermanentDelete } from './selection-bar-permanent.js';

export { isTrashView, allIdsInView } from './selection-view-detect.js';

/** Bar click dispatcher [操作栏点击分发] */
export async function onBarClick(e: MouseEvent): Promise<void> {
  const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  const ids = getSelectedIds();

  if (action === 'cancel') {
    exitSelectionMode();
    return;
  }
  if (action === 'select-all') {
    const all = await allIdsInView();
    // If everything already selected, clear instead (toggle) [若已全选则取消全选]
    if (all.length > 0 && all.every(id => ids.includes(id)) && ids.length === all.length) {
      clearSelection();
    } else {
      selectAll(all);
    }
    return;
  }
  if (ids.length === 0) return;

  if (action === 'delete') {
    await runSelectionDelete(ids);
  } else if (action === 'restore') {
    await runSelectionRestore(ids);
  } else if (action === 'permanent') {
    await runSelectionPermanentDelete(ids);
  }
}
