// Notes file system storage service [笔记文件系统存储服务]
// Each note is stored independently as .json (metadata) + .md (content) [每个笔记独立存储为 .json (元数据) + .md (正文)]
//
// Crash safety [崩溃安全]：
//   - All writes are atomic (temp + rename, see note-io.ts) [所有写入均为原子写 (临时文件+重命名)]
//   - saveNote writes .md before .json so a crash between the two keeps the
//     valuable content file newer than its metadata [先写 .md 后写 .json，两步之间崩溃时正文不会比元数据旧]
//   - Saves trigger throttled history snapshots; deletes snapshot first
//     [保存触发限频历史快照；删除前先快照]
//
// Split out [已拆分]：write lock → note-write-lock.ts, sort → note-sort.ts,
// list → note-list.ts, read → note-read.ts, save → note-save.ts,
// search → note-search.ts, delete → note-delete.ts, restore → note-restore.ts,
// permanent delete → note-permanent-delete.ts.

import type { NoteMeta } from 'sparklet/shared/types/notes';

/** Old note format from electron-store (before migration) [旧 electron-store 中的笔记格式 (迁移前)] */
interface OldNote {
  id?: string;
  title?: string;
  content?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  pinned?: boolean;
  starred?: boolean;
}

/**
 * Get notes directory path [获取笔记目录路径]
 */
export { getNotesDir, ensureNotesDir } from './note-paths';

export { listNotes } from './note-list.js';
export { getNote } from './note-read.js';
export { saveNote } from './note-save.js';
export { searchNotes } from './note-search.js';
export { deleteNote } from './note-delete.js';
export { restoreNote } from './note-restore.js';
export { permanentDeleteNote } from './note-permanent-delete.js';

export type { NoteMeta };
export type { OldNote };
