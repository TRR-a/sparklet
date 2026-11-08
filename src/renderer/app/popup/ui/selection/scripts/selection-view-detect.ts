// Selection bar: view detection & select-all ids [多选栏 - 视图判断与全选 ID]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { getVirtualCardNoteIds } from 'sparklet/renderer/app/popup/note/scripts/note-virtual-list.js';

/** Current view via body class (set by trash-view) [通过 body class 判断当前视图 (由 trash-view 设置)] */
export function isTrashView(): boolean {
  return document.body.classList.contains('trash-view');
}

/** Collect all ids in the current view for select-all [收集当前视图全部 id 用于全选] */
export async function allIdsInView(): Promise<string[]> {
  if (isTrashView()) {
    const notes = await storageManager.getTrashNotes();
    return notes.map(n => n.id);
  }
  // Main view: visible cards in the current virtual model [主视图：当前虚拟模型中的可见卡片]
  const visible = getVirtualCardNoteIds();
  if (visible.length > 0) return visible;
  const notes = await storageManager.getNotes();
  return notes.map(n => n.id);
}
