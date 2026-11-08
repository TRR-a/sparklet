// Storage manager: single-note CRUD - barrel [存储管理器 - 单篇笔记增删改 汇总出口]
//
// Split out [已拆分]：create → storage-note-create.ts, update → storage-note-update.ts,
// delete → storage-note-delete.ts, restore → storage-note-restore.ts.

export { createNote } from 'sparklet/renderer/shared/storage/note/storage-note-create.js';
export { updateNote } from 'sparklet/renderer/shared/storage/note/storage-note-update.js';
export { deleteNote } from 'sparklet/renderer/shared/storage/note/storage-note-delete.js';
export { restoreNote } from 'sparklet/renderer/shared/storage/note/storage-note-restore.js';
