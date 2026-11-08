// Note quick jump: keydown handling [笔记快速跳转 - 按键处理]

import { getHintsVisible, hideHints, isMainView, isModalOpen, showHints } from 'sparklet/renderer/app/popup/ui/quick-jump/scripts/note-quick-jump-hints.js';
import { digitIndex, jumpToIndex } from 'sparklet/renderer/app/popup/ui/quick-jump/scripts/note-quick-jump-target.js';

/** Global keydown handler (capture phase) [全局按键处理器 (capture 阶段)] */
export function onQuickJumpKeyDown(e: KeyboardEvent): void {
  // Bare Ctrl press → show chips [单按 Ctrl → 显示角标]
  if (e.key === 'Control' && !e.repeat) {
    if (isMainView() && !isModalOpen()) showHints();
    return;
  }
  // Ctrl + digit → quick jump (no other modifiers) [Ctrl+数字 → 快速跳转 (排除其他修饰键)]
  if (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
    const index = digitIndex(e.code);
    if (index !== -1) {
      e.preventDefault();
      e.stopPropagation();
      hideHints();
      if (isMainView() && !isModalOpen()) void jumpToIndex(index);
      return;
    }
  }
  // Any other key breaks the bare-Ctrl state → hide chips [其他按键破坏纯 Ctrl 状态 → 隐藏角标]
  if (getHintsVisible()) hideHints();
}
