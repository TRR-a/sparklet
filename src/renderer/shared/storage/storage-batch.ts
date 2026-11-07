// Storage manager: batch operations (optimistic cache) - barrel [存储管理器 - 批量操作 (乐观缓存) - 汇总出口]
//
// Split out [已拆分]：soft-delete → storage-batch-delete.ts,
// restore → storage-batch-restore.ts,
// permanent delete + cache read → storage-batch-permanent.ts.

export { deleteNotes } from './storage-batch-delete.js';
export { restoreNotes } from './storage-batch-restore.js';
export { permanentlyDeleteNotes, permanentlyDeleteNote, readCache } from './storage-batch-permanent.js';
