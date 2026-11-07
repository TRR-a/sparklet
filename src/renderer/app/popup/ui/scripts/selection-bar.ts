// Selection bar - multi-select action toolbar [多选操作栏]
// Shown above the note list when selection mode is active. Buttons differ by
// view: main view offers batch delete (to trash); trash view offers batch
// restore and batch permanent delete.
// [多选模式激活时显示在笔记列表上方。按钮因视图而异：主视图提供批量删除
// (到回收站)；回收站提供批量恢复与批量永久删除]
//
// Click dispatch & view actions in selection-bar-actions.ts [点击分发与视图操作在 selection-bar-actions.ts]
// DOM creation in selection-bar-dom.ts, bar refresh in selection-bar-update.ts
// [DOM 创建在 selection-bar-dom.ts，操作栏刷新在 selection-bar-update.ts]

import { onSelectionChange } from './selection-state.js';
import { ensureBar } from './selection-bar-dom.js';
import { updateSelectionBar } from './selection-bar-update.js';

export { updateSelectionBar } from './selection-bar-update.js';

let initialized = false;

/** Initialize the selection bar (call once) [初始化多选操作栏 (调用一次)] */
export function initSelectionBar(): void {
  if (initialized) return;
  initialized = true;
  ensureBar();
  onSelectionChange(updateSelectionBar);
}
