// Note CRUD result types [笔记增删改查结果类型]

import type { Note, NoteMeta } from './note-entity.js';

/** Result of listing notes [笔记列表结果] */
export interface NoteListResult {
  success: boolean;
  notes?: NoteMeta[];
  error?: string;
}

/** Result of getting a single note [获取单篇笔记结果] */
export interface NoteGetResult {
  success: boolean;
  note?: Note;
  error?: string;
}

/** Result of saving a note [保存笔记结果] */
export interface NoteSaveResult {
  success: boolean;
  note?: Note;
  error?: string;
}

/** Result of note operations (delete/restore/permanentDelete) [笔记操作结果 (删除/恢复/永久删除)] */
export interface NoteOperationResult {
  success: boolean;
  error?: string;
}

/** Result of full-text search (title + content) [全文搜索结果 (标题 + 正文)] */
export interface NoteSearchResult {
  success: boolean;
  notes?: NoteMeta[];
  error?: string;
}
