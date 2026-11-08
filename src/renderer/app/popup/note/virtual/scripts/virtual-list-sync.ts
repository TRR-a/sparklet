// Virtual list: selection / scroll sync [虚拟列表 - 选中与滚动同步]

import { getSidebar } from './virtual-list-geometry.js';
import { getItems, getOffsets, cardCache } from './virtual-list-state.js';

/**
 * Sync multi-select state onto attached and cached cards [将多选选中态同步到已挂载与缓存的卡片]
 * @param isSelected Predicate returning whether a note id is selected [判断某笔记 id 是否选中的谓词]
 */
export function applySelection(isSelected: (id: string) => boolean): void {
  const apply = (el: Element) => {
    if (!el.classList.contains('note-list-item')) return;
    const id = el.getAttribute('data-note-id');
    if (!id) return;
    el.classList.toggle('selected', isSelected(id));
  };
  document.querySelectorAll('#noteList .note-list-item').forEach(apply);
  for (const el of cardCache.values()) apply(el);
}

/**
 * Note ids of all cards in the current model order (collapsed groups excluded by builders) [当前模型中全部卡片的笔记 id 顺序 (折叠分组已由构建方排除)]
 */
export function collectCardNoteIds(): string[] {
  return getItems().filter(it => it.kind === 'card').map(it => (it as Extract<typeof it, { kind: 'card' }>).note.id);
}

/**
 * Scroll the sidebar so the note's card is visible [滚动侧栏使笔记卡片可见]
 * No-op if the note is not in the current model [笔记不在当前模型中则不动作]
 */
export function scrollCardIntoView(noteId: string): void {
  const items = getItems();
  const idx = items.findIndex(it => it.kind === 'card' && it.note.id === noteId);
  if (idx === -1) return;
  const sidebar = getSidebar();
  if (!sidebar) return;
  const offsets = getOffsets();
  const top = offsets[idx];
  const bottom = offsets[idx + 1];
  if (top < sidebar.scrollTop + 8) {
    sidebar.scrollTop = Math.max(0, top - 8);
  } else if (bottom > sidebar.scrollTop + sidebar.clientHeight - 8) {
    sidebar.scrollTop = Math.max(0, bottom - sidebar.clientHeight + 8);
  }
}
