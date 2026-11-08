// Note quick jump: Ctrl hint chips [笔记快速跳转 - Ctrl 角标]
//
// Split out [已拆分]：view predicates → note-quick-jump-view.ts.

import { getVirtualCardNoteIds } from '../../../note/scripts/note-virtual-list.js';

export { isMainView, isModalOpen } from './note-quick-jump-view.js';

const HINT_CLASS = 'note-quick-hint';

/** Chips currently shown [角标是否显示中] */
let hintsVisible = false;

/**
 * Find the DOM card of a note id (null when outside the virtual render window) [按笔记 id 查找 DOM 卡片 (虚拟窗口外返回 null)]
 */
export function findCard(noteId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`#noteList .note-list-item[data-note-id="${noteId}"]`);
}

/** Whether chips are currently visible [角标当前是否可见] */
export function getHintsVisible(): boolean { return hintsVisible; }

/**
 * Show "Ctrl N" chips on the first 10 visible cards [在前 10 个可见卡片上显示 Ctrl N 角标]
 */
export function showHints(): void {
  if (hintsVisible) return;
  const ids = getVirtualCardNoteIds().slice(0, 10);
  let shown = false;
  ids.forEach((noteId, i) => {
    const card = findCard(noteId);
    if (!card) return; // Scrolled out of the render window [滚出渲染窗口的卡片不显示角标]
    const hint = document.createElement('span');
    hint.className = HINT_CLASS;
    hint.textContent = i === 9 ? 'Ctrl 0' : `Ctrl ${i + 1}`;
    card.appendChild(hint);
    shown = true;
  });
  hintsVisible = shown;
}

/**
 * Remove all quick-jump chips [移除所有快速跳转角标]
 */
export function hideHints(): void {
  if (!hintsVisible) return;
  document.querySelectorAll('.' + HINT_CLASS).forEach(el => el.remove());
  hintsVisible = false;
}
