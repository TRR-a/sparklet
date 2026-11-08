// Trash view: enter / exit toggle [回收站视图 - 进入与退出切换]
//
// Split out [已拆分]：enter → trash-view-enter.ts, exit → trash-view-exit.ts.

import { getCurrentView } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-state.js';
import { enterTrashView } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-enter.js';
import { exitTrashView } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-exit.js';

/**
 * Toggle between main and trash view [在主视图和回收站视图间切换]
 */
export async function toggleTrashView(): Promise<void> {
  if (getCurrentView() === 'main') {
    await enterTrashView();
  } else {
    await exitTrashView();
  }
}
