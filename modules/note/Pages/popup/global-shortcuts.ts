// Global shortcuts - app-wide key bindings for the popup [全局快捷键 - 弹窗的应用级按键绑定]
//
// Ctrl+F focus search / Ctrl+N new note / Ctrl+P toggle preview / F1 shortcut panel.
// Ctrl+digit quick jump is bound in note-quick-jump.ts; double-Esc exit in exit-dialog.ts
// [Ctrl+F 聚焦搜索 / Ctrl+N 新建笔记 / Ctrl+P 切换预览 / F1 快捷键面板。
//  Ctrl+数字快速跳转绑定在 note-quick-jump.ts；双击 Esc 退出在 exit-dialog.ts]

import { createNewNote, togglePreview } from './note-editor.js';
import { focusSearchInput } from './note-search.js';
import { toggleShortcutPanel } from './shortcut-panel.js';

/**
 * Check whether any modal is open (shortcuts disabled while modals own the keyboard) [是否有弹窗打开 (弹窗期间快捷键让位于弹窗键盘处理)]
 */
function isModalOpen(): boolean {
  const ids = ['customConfirmModal', 'noteInfoModal', 'exitConfirmModal', 'shortcutModal'];
  return ids.some(id => {
    const el = document.getElementById(id);
    return el !== null && (el as HTMLElement).style.display !== 'none';
  });
}

/**
 * Global keydown handler (capture phase) [全局按键处理器 (capture 阶段)]
 */
function onKeyDown(e: KeyboardEvent): void {
  // F1 toggles the shortcut panel even while other modals are open [F1 切换快捷键面板 (其他弹窗打开时也可用)]
  if (e.key === 'F1') {
    e.preventDefault();
    toggleShortcutPanel();
    return;
  }

  if (isModalOpen()) return;

  if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
    const key = e.key.toLowerCase();
    if (key === 'f') {
      e.preventDefault();
      focusSearchInput();
    } else if (key === 'n') {
      e.preventDefault();
      void createNewNote();
    } else if (key === 'p') {
      e.preventDefault();
      void togglePreview();
    }
  }
}

/**
 * Bind global shortcuts (call once on init) [绑定全局快捷键 (初始化时调用一次)]
 */
export function initGlobalShortcuts(): void {
  document.addEventListener('keydown', onKeyDown, true);
}
