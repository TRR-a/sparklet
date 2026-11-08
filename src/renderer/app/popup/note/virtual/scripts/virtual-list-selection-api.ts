// Virtual list: selection & lookup helpers [虚拟列表 - 选中与查找辅助]

import { applySelection, collectCardNoteIds, scrollCardIntoView } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-sync.js';

/**
 * Sync multi-select state onto attached and cached cards [将多选选中态同步到已挂载与缓存的卡片]
 * @param isSelected Predicate returning whether a note id is selected [判断某笔记 id 是否选中的谓词]
 */
export function syncSelectionInList(isSelected: (id: string) => boolean): void {
  applySelection(isSelected);
}

/**
 * Note ids of all cards in the current model order (collapsed groups excluded by builders) [当前模型中全部卡片的笔记 id 顺序 (折叠分组已由构建方排除)]
 */
export function getVirtualCardNoteIds(): string[] {
  return collectCardNoteIds();
}

/**
 * Scroll the sidebar so the note's card is visible [滚动侧栏使笔记卡片可见]
 * No-op if the note is not in the current model [笔记不在当前模型中则不动作]
 */
export function scrollNoteIntoView(noteId: string): void {
  scrollCardIntoView(noteId);
}
