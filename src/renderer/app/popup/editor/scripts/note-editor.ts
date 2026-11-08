// Popup note editor - entry barrel [弹窗笔记编辑器 - 入口]
// State in editor-state.ts, actions in editor-actions.ts [状态在 editor-state.ts，操作在 editor-actions.ts]
// Note operations (save/create/delete/color/pin) in note-operations.ts, list rendering in note-list.ts
// [笔记操作在 note-operations.ts，列表渲染在 note-list.ts]

// Re-export note operations for backward compatibility [重新导出笔记操作以保持向后兼容]
export { saveCurrentNote, debounceSave, createNewNote, changeNoteColor, togglePinNote, toggleStarNote } from 'sparklet/renderer/app/popup/note/scripts/note-operations.js';
// Re-export list rendering for backward compatibility [重新导出列表渲染以保持向后兼容]
export { renderNoteList } from 'sparklet/renderer/app/popup/note/list/scripts/note-list.js';
export { bindNoteMenuGlobalHandler } from 'sparklet/renderer/app/popup/note/scripts/note-menu.js';
export { showNoteInfo } from 'sparklet/renderer/app/popup/modals/history/scripts/note-info-modal.js';
export type { NoteListItem } from 'sparklet/renderer/app/popup/note/list/scripts/note-list.js';

export {
  setCurrentNoteId,
  getCurrentNoteId,
  setPreviewMode,
  getPreviewMode,
} from 'sparklet/renderer/app/popup/editor/scripts/editor-state.js';

export {
  updateActiveColor,
  loadNoteIntoEditor,
  switchNote,
  closeNote,
  togglePreview,
  loadNotes,
} from 'sparklet/renderer/app/popup/editor/scripts/editor-actions.js';
