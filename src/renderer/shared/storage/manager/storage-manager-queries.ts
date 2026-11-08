// Storage manager: query methods [存储管理器 - 查询方法]

import type { Note, NoteMeta } from 'sparklet/shared/types/note/notes.js';
import { initStore, loadFromFS } from '../storage-cache.js';
import { getNotes, getAllNotes, getTrashNotes, getNoteById } from '../storage-query.js';

/** Read-side methods of the storage facade [存储外观层的读取侧方法] */
export const storageManagerQueries = {
  /** Initialize: load all notes from file system [初始化：从文件系统加载所有笔记] */
  async init(): Promise<NoteMeta[] | null> {
    return initStore();
  },

  /** Load from file system and cache [从文件系统加载并缓存] */
  async loadFromFS(): Promise<NoteMeta[]> {
    return loadFromFS();
  },

  /** Return non-deleted notes [返回未删除的笔记] */
  async getNotes(): Promise<NoteMeta[]> {
    return getNotes();
  },

  /** Return all notes (including deleted) [返回所有笔记 (含已删除)] */
  async getAllNotes(): Promise<NoteMeta[]> {
    return getAllNotes();
  },

  /** Return trash notes [返回回收站笔记] */
  async getTrashNotes(): Promise<NoteMeta[]> {
    return getTrashNotes();
  },

  /** Get a single note by ID (with content) [按 ID 获取单篇笔记 (含正文)] */
  async getNoteById(id: string): Promise<Note | null> {
    return getNoteById(id);
  },
};
