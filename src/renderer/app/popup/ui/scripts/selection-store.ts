// Multi-select store: state, queries, subscription [多选存储 - 状态、查询、订阅]

type SelectionListener = () => void;

let selectionMode = false;
const selectedIds = new Set<string>();
const listeners = new Set<SelectionListener>();

/** Notify all subscribers (listener errors must not break selection) [通知全部订阅者 (订阅者异常不得中断选择)] */
export function notifySelection(): void {
  for (const fn of listeners) {
    try { fn(); } catch { /* listener errors must not break selection */ }
  }
}

/** Whether multi-select mode is active [多选模式是否激活] */
export function isSelectionMode(): boolean {
  return selectionMode;
}

/** Set the mode flag without notifying [设置模式标志 (不通知)] */
export function setSelectionMode(on: boolean): void {
  selectionMode = on;
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

/** Add / remove one id without notifying [增删单个 id (不通知)] */
export function toggleSelectedId(noteId: string): void {
  if (selectedIds.has(noteId)) selectedIds.delete(noteId);
  else selectedIds.add(noteId);
}

/** Replace the whole selection without notifying [整体替换选择 (不通知)] */
export function replaceSelectedIds(ids: string[]): void {
  selectedIds.clear();
  for (const id of ids) selectedIds.add(id);
}

/** Clear the selection without notifying [清空选择 (不通知)] */
export function clearSelectedIds(): void {
  selectedIds.clear();
}

/** Subscribe to selection changes; returns an unsubscribe function [订阅选择变化；返回取消订阅函数] */
export function onSelectionChange(fn: SelectionListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
