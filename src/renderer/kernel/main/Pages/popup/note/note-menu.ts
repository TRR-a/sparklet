// Note more-menu - open/close state and global handlers [笔记更多菜单 - 开关状态与全局处理器]

/** Currently open more-menu note ID (null = no menu open) [当前打开更多菜单的笔记 ID (null=无菜单打开)] */
let openMenuNoteId: string | null = null;

/**
 * Close all open note more-menus [关闭所有打开的笔记更多菜单]
 */
export function closeAllMenus(): void {
  document.querySelectorAll('.note-more-menu.show').forEach(menu => {
    menu.classList.remove('show');
  });
  openMenuNoteId = null;
}

/**
 * Toggle the more-menu of a card (closes all others first) [切换卡片更多菜单 (先关闭其他菜单)]
 * @param card Card element containing the menu [包含菜单的卡片元素]
 * @param noteId Note ID that owns the menu [菜单所属笔记 ID]
 */
export function toggleCardMenu(card: HTMLElement, noteId: string): void {
  const menu = card.querySelector('.note-more-menu');
  if (!menu) return;
  const isOpen = menu.classList.contains('show');
  closeAllMenus();
  if (!isOpen) {
    menu.classList.add('show');
    openMenuNoteId = noteId;
  }
}

/**
 * Bind global click-to-close menu handler (call once on init) [绑定全局点击关闭菜单处理器 (初始化时调用一次)]
 */
export function bindNoteMenuGlobalHandler(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.note-more-btn') && !(e.target as HTMLElement).closest('.note-more-menu')) {
      closeAllMenus();
    }
  });
}
