// Exit confirm dialog: global keydown [退出确认弹窗 - 全局按键]

import {
  DOUBLE_ESC_INTERVAL,
  getFocusedIndex,
  getIsDialogOpen,
  getLastEscTime,
  setFocusedIndex,
  setLastEscTime,
} from 'sparklet/renderer/app/popup/modals/exit/scripts/exit-dialog-state.js';
import { isOtherModalOpen, updateFocus } from 'sparklet/renderer/app/popup/modals/exit/scripts/exit-dialog-focus.js';
import { closeDialog, performQuit, showExitDialog } from 'sparklet/renderer/app/popup/modals/exit/scripts/exit-dialog-actions.js';

/**
 * Global keydown handler (capture phase to win over editor key bindings) [全局按键处理器 (capture 阶段优先于编辑器按键绑定)]
 */
export function onExitDialogKeyDown(e: KeyboardEvent): void {
  if (getIsDialogOpen()) {
    // Dialog open: full keyboard navigation [弹窗打开：完整键盘导航]
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeDialog(); // Esc on any button = return [任意按钮上按 Esc 都执行返回]
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      setFocusedIndex(1 - getFocusedIndex()); // Toggle between return (0) and quit (1) [在返回 (0) 与退出 (1) 间切换]
      updateFocus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (getFocusedIndex() === 0) closeDialog();
      else void performQuit();
    }
    return;
  }

  // Double-Esc detection (skipped while other modals are open) [双击 Esc 检测 (其他弹窗打开时跳过)]
  if (e.key === 'Escape' && !isOtherModalOpen()) {
    const now = Date.now();
    if (now - getLastEscTime() < DOUBLE_ESC_INTERVAL) {
      setLastEscTime(0);
      showExitDialog();
    } else {
      setLastEscTime(now);
    }
  }
}
