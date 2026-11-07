// Storage manager: single-note CRUD - barrel [存储管理器 - 单篇笔记增删改 汇总出口]
//
// Split out [已拆分]：create → storage-note-create.ts, update → storage-note-update.ts,
// delete → storage-note-delete.ts, restore → storage-note-restore.ts.

export { createNote } from './storage-note-create.js';
export { updateNote } from './storage-note-update.js';
export { deleteNote } from './storage-note-delete.js';
export { restoreNote } from './storage-note-restore.js';
