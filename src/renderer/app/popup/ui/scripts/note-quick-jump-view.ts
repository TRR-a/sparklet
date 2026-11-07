// Note quick jump: view state predicates [笔记快速跳转 - 视图状态判定]

/**
 * Check whether we are in the main notes view (not trash) [是否处于主笔记视图 (非回收站)]
 */
export function isMainView(): boolean {
  return !document.body.classList.contains('trash-view');
}

/**
 * Check whether any modal is open (chips disabled) [是否有弹窗打开 (弹窗时禁用角标)]
 */
export function isModalOpen(): boolean {
  const ids = ['customConfirmModal', 'noteInfoModal', 'exitConfirmModal', 'shortcutModal'];
  return ids.some(id => {
    const el = document.getElementById(id);
    return el !== null && (el as HTMLElement).style.display !== 'none';
  });
}
