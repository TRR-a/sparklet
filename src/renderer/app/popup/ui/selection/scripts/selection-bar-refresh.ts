// Selection bar: refresh the active view [多选栏 - 重渲染当前视图]

import { isTrashView } from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-view-detect.js';

/** Re-render the list of whichever view is active [重渲染当前激活视图的列表] */
export async function refreshCurrentView(): Promise<void> {
  if (isTrashView()) {
    const { renderTrashList } = await import('sparklet/renderer/app/popup/ui/trash/scripts/trash-view.js');
    await renderTrashList();
  } else {
    const { loadNotes } = await import('sparklet/renderer/app/popup/editor/scripts/note-editor.js');
    await loadNotes();
  }
}
