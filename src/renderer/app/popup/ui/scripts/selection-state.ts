// Multi-select state [多选状态]
// Shared by the main note list and the trash view. Holds the current selection
// mode and the set of selected note ids; subscribers are notified on change so
// the selection bar and card checkboxes stay in sync across virtual-list re-renders.
// [主笔记列表与回收站共用。持有当前多选模式与已选笔记 id 集合；变化时通知
// 订阅者，使操作栏与卡片复选框在虚拟列表重渲染间保持同步]
//
// Split out [已拆分]：store/queries/subscription → selection-store.ts,
// mode & selection mutations → selection-actions.ts.

export {
  isSelectionMode,
  isSelected,
  getSelectedCount,
  getSelectedIds,
  onSelectionChange,
} from './selection-store.js';
export {
  enterSelectionMode,
  exitSelectionMode,
  toggleSelect,
  selectAll,
  clearSelection,
} from './selection-actions.js';
