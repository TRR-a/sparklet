// Multi-select actions [多选操作]

import {
  clearSelectedIds,
  getSelectedCount,
  isSelectionMode,
  notifySelection,
  replaceSelectedIds,
  setSelectionMode,
  toggleSelectedId,
} from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-store.js';

/** Enter multi-select mode (keeps current selection, starts empty if none) [进入多选模式 (保留当前选择，无则从空开始)] */
export function enterSelectionMode(): void {
  if (isSelectionMode()) return;
  setSelectionMode(true);
  notifySelection();
}

/** Exit multi-select mode and clear the selection [退出多选模式并清空选择] */
export function exitSelectionMode(): void {
  if (!isSelectionMode() && getSelectedCount() === 0) return;
  setSelectionMode(false);
  clearSelectedIds();
  notifySelection();
}

/** Toggle a note id in the selection; auto-enters selection mode [切换某笔记 id 的选中状态；自动进入多选模式] */
export function toggleSelect(noteId: string): void {
  if (!isSelectionMode()) setSelectionMode(true);
  toggleSelectedId(noteId);
  notifySelection();
}

/** Select all ids from a provider callback (e.g. all visible notes) [从提供方回调全选 (如全部可见笔记)] */
export function selectAll(ids: string[]): void {
  if (!isSelectionMode()) setSelectionMode(true);
  replaceSelectedIds(ids);
  notifySelection();
}

/** Clear selection without exiting mode [清空选择但不退出模式] */
export function clearSelection(): void {
  if (getSelectedCount() === 0) return;
  clearSelectedIds();
  notifySelection();
}
