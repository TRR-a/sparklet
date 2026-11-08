// Exit dialog: open/close/quit actions [退出弹窗 - 打开/关闭/退出动作]

import { windowApi } from 'sparklet/renderer/shared/index.js';
import { getIsDialogOpen, setIsDialogOpen, setFocusedIndex } from 'sparklet/renderer/app/popup/modals/exit/scripts/exit-dialog-state.js';
import { getModal, getReturnBtn, updateFocus } from 'sparklet/renderer/app/popup/modals/exit/scripts/exit-dialog-focus.js';
import { saveAllBeforeQuit } from 'sparklet/renderer/app/popup/modals/exit/scripts/exit-dialog-save.js';

/**
 * Close the dialog (return action, no quit) [关闭弹窗 (返回动作，不退出)]
 */
export function closeDialog(): void {
  setIsDialogOpen(false);
  const modal = getModal();
  if (modal) (modal as HTMLElement).style.display = 'none';
}

/**
 * Perform quit: save everything then quit the app [执行退出：先保存全部内容再退出应用]
 */
export async function performQuit(): Promise<void> {
  await saveAllBeforeQuit();
  await windowApi.quitApp();
}

/**
 * Show the exit confirm dialog [显示退出确认弹窗]
 */
export function showExitDialog(): void {
  setIsDialogOpen(true);
  setFocusedIndex(0); // Default highlight = return [默认高亮返回]
  updateFocus();
  const modal = getModal();
  if (modal) (modal as HTMLElement).style.display = 'flex';
  // Move focus onto the dialog so Enter doesn't leak into note editor [把焦点移入弹窗，避免 Enter 泄漏进笔记编辑器]
  getReturnBtn()?.focus();
}

/** Read the open state (used by the key handler) [读取打开状态 (按键处理器使用)] */
export { getIsDialogOpen };
