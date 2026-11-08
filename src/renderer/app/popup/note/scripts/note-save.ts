// Note save: debounced persistence - barrel [笔记保存 - 防抖落盘 - 汇总出口]
//
// Split out [已拆分]：debounce timers → note-save-debounce.ts,
// persist → note-save-core.ts.

import { clearSaveTimers, debounceSave as runDebounce } from 'sparklet/renderer/app/popup/note/scripts/note-save-debounce.js';
import { saveCurrentNote } from 'sparklet/renderer/app/popup/note/scripts/note-save-core.js';

export { clearSaveTimers, saveCurrentNote };

/**
 * Debounced save: 800ms trailing + 5s max wait
 * [防抖保存：800ms 尾随触发 + 连续输入最多 5s 强制落盘]
 */
export function debounceSave(): void {
  runDebounce(() => {
    void saveCurrentNote();
  });
}
