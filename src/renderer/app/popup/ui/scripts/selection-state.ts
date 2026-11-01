// Multi-select state [多选状态]
// Shared by the main note list and the trash view. Holds the current selection
// mode and the set of selected note ids; subscribers are notified on change so
// the selection bar and card checkboxes stay in sync across virtual-list re-renders.
// [主笔记列表与回收站共用。持有当前多选模式与已选笔记 id 集合；变化时通知
// 订阅者，使操作栏与卡片复选框在虚拟列表重渲染间保持同步]

type SelectionListener = () => void;

let selectionMode = false;
const selectedIds = new Set<string>();
const listeners = new Set<SelectionListener>();

function notify(): void {
  for (const fn of listeners) {
    try { fn(); } catch { /* listener errors must not break selection */ }
  }
}

/** Whether multi-select mode is active [多选模式是否激活] */
export function isSelectionMode(): boolean {
  return selectionMode;
}

/** Enter multi-select mode (keeps current selection, starts empty if none) [进入多选模式 (保留当前选择，无则从空开始)] */
export function enterSelectionMode(): void {
  if (selectionMode) return;
  selectionMode = true;
  notify();
}

/** Exit multi-select mode and clear the selection [退出多选模式并清空选择] */
export function exitSelectionMode(): void {
  if (!selectionMode && selectedIds.size === 0) return;
  selectionMode = false;
  selectedIds.clear();
  notify();
}

/** Toggle a note id in the selection; auto-enters selection mode [切换某笔记 id 的选中状态；自动进入多选模式] */
export function toggleSelect(noteId: string): void {
  if (!selectionMode) selectionMode = true;
  if (selectedIds.has(noteId)) selectedIds.delete(noteId);
  else selectedIds.add(noteId);
  notify();
}

/** Whether a note is selected [笔记是否被选中] */
export function isSelected(noteId: string): boolean {
  return selectedIds.has(noteId);
}

/** Selected count [已选数量] */
export function getSelectedCount(): number {
  return selectedIds.size;
}

/** Snapshot of selected ids (copy) [已选 id 的快照 (副本)] */
export function getSelectedIds(): string[] {
  return Array.from(selectedIds);
}

/** Select all ids from a provider callback (e.g. all visible notes) [从提供方回调全选 (如全部可见笔记)] */
export function selectAll(ids: string[]): void {
  if (!selectionMode) selectionMode = true;
  selectedIds.clear();
  for (const id of ids) selectedIds.add(id);
  notify();
}

/** Clear selection without exiting mode [清空选择但不退出模式] */
export function clearSelection(): void {
  if (selectedIds.size === 0) return;
  selectedIds.clear();
  notify();
}

/** Subscribe to selection changes; returns an unsubscribe function [订阅选择变化；返回取消订阅函数] */
export function onSelectionChange(fn: SelectionListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
