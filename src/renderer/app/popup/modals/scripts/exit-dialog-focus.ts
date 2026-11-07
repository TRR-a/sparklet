// Exit dialog: element lookups + focus ring [退出弹窗 - 元素定位与焦点描边]

import { getFocusedIndex } from './exit-dialog-state.js';

export function getModal(): HTMLElement | null {
  return document.getElementById('exitConfirmModal');
}

export function getReturnBtn(): HTMLElement | null {
  return document.getElementById('exitReturnBtn');
}

export function getQuitBtn(): HTMLElement | null {
  return document.getElementById('exitQuitBtn');
}

/**
 * Check if another modal is currently open (its Esc handling wins over double-Esc) [检查是否有其他弹窗打开 (它们的 Esc 优先于双击检测)]
 */
export function isOtherModalOpen(): boolean {
  const ids = ['customConfirmModal', 'noteInfoModal', 'noteHistoryModal', 'shortcutModal'];
  return ids.some(id => {
    const el = document.getElementById(id);
    return el !== null && (el as HTMLElement).style.display !== 'none';
  });
}

/**
 * Update focused-button highlight ring [更新焦点按钮高亮描边]
 */
export function updateFocus(): void {
  const returnBtn = getReturnBtn();
  const quitBtn = getQuitBtn();
  if (returnBtn) returnBtn.classList.toggle('focused', getFocusedIndex() === 0);
  if (quitBtn) quitBtn.classList.toggle('focused', getFocusedIndex() === 1);
}
