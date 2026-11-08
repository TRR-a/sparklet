// Note actions - barrel [笔记操作 - 汇总出口]
// Create, color, pin/star, tags, delete [创建、颜色、置顶/星标、标签、删除]
//
// Split out [已拆分]：create → note-create.ts, color → note-color-action.ts,
// pin → note-pin.ts, star → note-star.ts, tags → note-edit-tags.ts,
// delete → note-delete-action.ts.

export { createNewNote } from 'sparklet/renderer/app/popup/note/scripts/note-create.js';
export { changeNoteColor } from 'sparklet/renderer/app/popup/note/scripts/note-color-action.js';
export { togglePinNote } from 'sparklet/renderer/app/popup/note/scripts/note-pin.js';
export { toggleStarNote } from 'sparklet/renderer/app/popup/note/scripts/note-star.js';
export { editTagsNote } from 'sparklet/renderer/app/popup/note/scripts/note-edit-tags.js';
export { handleDeleteNote } from 'sparklet/renderer/app/popup/note/scripts/note-delete-action.js';
