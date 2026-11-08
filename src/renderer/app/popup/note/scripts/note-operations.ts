// Note operations - entry barrel [笔记操作 - 入口]
// Saving in note-save.ts, actions in note-actions.ts [保存在 note-save.ts，操作在 note-actions.ts]

export { clearSaveTimers, saveCurrentNote, debounceSave } from 'sparklet/renderer/app/popup/note/scripts/note-save.js';
export {
  createNewNote,
  changeNoteColor,
  togglePinNote,
  toggleStarNote,
  editTagsNote,
  handleDeleteNote,
} from 'sparklet/renderer/app/popup/note/scripts/note-actions.js';
