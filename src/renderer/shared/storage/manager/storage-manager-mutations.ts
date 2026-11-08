// Storage manager: mutation methods [存储管理器 - 变更方法]

import type { Note } from 'sparklet/shared/types/note/notes.js';
import { createNote, updateNote, deleteNote, restoreNote } from '../storage-crud.js';
import { deleteNotes, restoreNotes, permanentlyDeleteNotes, permanentlyDeleteNote } from '../batch/storage-batch.js';

/** Write-side methods of the storage facade [存储外观层的写入侧方法] */
export const storageManagerMutations = {
  /** Create a new note (persist to file system) [创建新笔记 (物理文件落盘)] */
  async createNote(title: string = '无标题', color: string = '#4285f4'): Promise<Note> {
    return createNote(title, color);
  },

  /** Update a note [更新笔记] */
  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    return updateNote(id, updates);
  },

  /** Soft delete (move to trash) [软删除 (移回收站)] */
  async deleteNote(id: string): Promise<boolean> {
    return deleteNote(id);
  },

  /** Restore from trash [从回收站恢复] */
  async restoreNote(id: string): Promise<boolean> {
    return restoreNote(id);
  },

  /** Permanently delete (physically remove files) [永久删除 (物理删除文件)] */
  async permanentlyDeleteNote(id: string): Promise<boolean> {
    return permanentlyDeleteNote(id);
  },

  /** Batch soft-delete (move to trash), returns count succeeded [批量软删除 (移回收站)，返回成功数] */
  async deleteNotes(ids: string[]): Promise<number> {
    return deleteNotes(ids);
  },

  /** Batch restore from trash, returns count succeeded [批量从回收站恢复，返回成功数] */
  async restoreNotes(ids: string[]): Promise<number> {
    return restoreNotes(ids);
  },

  /** Batch permanent delete, returns count succeeded [批量永久删除，返回成功数] */
  async permanentlyDeleteNotes(ids: string[]): Promise<number> {
    return permanentlyDeleteNotes(ids);
  },
};
