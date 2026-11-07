// Custom select: open/close helpers [自定义下拉框 - 开合辅助]

/** Close this select container [关闭当前下拉框] */
export function closeSelect(container: HTMLElement): void {
  container.classList.remove('open');
}

/** Open this select, closing any other open one first [打开当前下拉框，先关闭其他已打开的] */
export function openSelect(container: HTMLElement): void {
  // Close all other open selects [关闭其他已打开的下拉框]
  document.querySelectorAll('.custom-select.open').forEach((el) => {
    if (el !== container) el.classList.remove('open');
  });
  container.classList.add('open');
}

/** Close every open select (document-level outside click) [关闭所有已打开的下拉框 (文档级外部点击)] */
export function closeAllSelects(): void {
  document.querySelectorAll('.custom-select.open').forEach((el) => el.classList.remove('open'));
}
