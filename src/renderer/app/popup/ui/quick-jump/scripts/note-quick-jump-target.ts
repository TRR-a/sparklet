// Note quick jump: digit mapping + jump target [笔记快速跳转 - 数字映射与跳转目标]

import { getVirtualCardNoteIds, scrollNoteIntoView } from 'sparklet/renderer/app/popup/note/scripts/note-virtual-list.js';
import { findCard } from 'sparklet/renderer/app/popup/ui/quick-jump/scripts/note-quick-jump-hints.js';

/**
 * Map Digit/Numpad key code to quick-jump index ('0' = 10th) [数字键映射为跳转索引 ('0'=第 10 个)]
 * @returns 0-based index, or -1 if not a digit key [非数字键返回 -1]
 */
export function digitIndex(code: string): number {
  const m = code.match(/^(?:Digit|Numpad)([0-9])$/);
  if (!m) return -1;
  return m[1] === '0' ? 9 : Number(m[1]) - 1;
}

/**
 * Jump to the Nth visible note [跳转到第 N 个可见笔记]
 */
export async function jumpToIndex(index: number): Promise<void> {
  const noteId = getVirtualCardNoteIds()[index];
  if (!noteId) return;
  // Dynamic import to avoid circular dependency (same as note-card.ts) [动态导入避免循环依赖 (与 note-card.ts 相同)]
  const { switchNote } = await import('sparklet/renderer/app/popup/editor/scripts/note-editor.js');
  void switchNote(noteId);
  // Card may be outside the virtual render window - scroll it into view [卡片可能在虚拟渲染窗口外 - 滚动到可见]
  if (!findCard(noteId)) scrollNoteIntoView(noteId);
}
