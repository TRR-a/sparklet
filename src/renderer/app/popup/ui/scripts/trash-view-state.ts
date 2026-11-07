// Trash view: state [回收站视图 - 状态]

/** Current view state: 'main' or 'trash' [当前视图状态：'main' 或 'trash'] */
let currentView = 'main';

/** Get current view [获取当前视图] */
export function getCurrentView(): string {
  return currentView;
}

/** Set current view [设置当前视图] */
export function setCurrentView(view: 'main' | 'trash'): void {
  currentView = view;
}
