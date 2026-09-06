// Storage manager - Sparklet file system storage manager [存储管理器 - Sparklet 文件系统存储管理器]
// Each note is stored independently as .json (metadata) + .md (content) [每个笔记独立存储为 .json (元数据) + .md (正文)]

import type { Note, NoteMeta } from '../../../src/shared/types/notes';
import { noteApi } from '../api/note-api.js';

/** Storage manager class for note CRUD operations with caching [笔记增删改查的存储管理器类] */
class StorageManager {
  private notesCache: NoteMeta[] | null = null;
  private initialized = false;

  /** Initialize: load all notes from file system [初始化：从文件系统加载所有笔记] */
  async init(): Promise<NoteMeta[] | null> {
    if (this.initialized) return this.notesCache;
    await this.loadFromFS();
    this.initialized = true;
    return this.notesCache;
  }

  /** Load from file system and cache [从文件系统加载并缓存] */
  async loadFromFS(): Promise<NoteMeta[]> {
    try {
      const result = await noteApi.list();
      if (result.success && result.notes) {
        this.notesCache = result.notes;
      } else {
        console.error('加载笔记列表失败:', result.error);
        this.notesCache = [];
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('加载笔记异常:', msg);
      this.notesCache = [];
    }
    return this.notesCache;
  }

  /** Return non-deleted notes [返回未删除的笔记] */
  async getNotes(): Promise<NoteMeta[]> {
    if (!this.initialized) await this.init();
    return this.notesCache!.filter(note => !note.isDeleted);
  }

  /** Return all notes (including deleted) [返回所有笔记 (含已删除)] */
  async getAllNotes(): Promise<NoteMeta[]> {
    if (!this.initialized) await this.init();
    return [...this.notesCache!];
  }

  /** Return trash notes [返回回收站笔记] */
  async getTrashNotes(): Promise<NoteMeta[]> {
    if (!this.initialized) await this.init();
    return this.notesCache!.filter(note => note.isDeleted);
  }

  /** Get a single note by ID (with content) [按 ID 获取单篇笔记 (含正文)] */
  async getNoteById(id: string): Promise<Note | null> {
    if (!this.initialized) await this.init();
    try {
      const result = await noteApi.get(id);
      if (result.success && result.note) {
        return result.note;
      }
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('获取笔记失败:', msg);
      return null;
    }
  }

  /** Create a new note (persist to file system) [创建新笔记 (物理文件落盘)] */
  async createNote(title: string = '无标题', color: string = '#4285f4'): Promise<Note> {
    if (!this.initialized) await this.init();

    const newNote: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title || '无标题',
      content: '',
      color: color || '#4285f4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: null,
      pinned: false,
      starred: false
    };

    // Save to file system via IPC [调用 IPC 保存到文件系统]
    const result = await noteApi.save(newNote);
    if (result.success) {
      const { content, ...meta } = newNote;
      this.notesCache!.push(meta);
      return newNote;
    } else {
      const msg = result.error || 'Unknown error';
      console.error('创建笔记失败:', msg);
      throw new Error(msg);
    }
  }

  /** Update a note [更新笔记] */
  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    if (!this.initialized) await this.init();

    const index = this.notesCache!.findIndex(note => note.id === id);
    if (index === -1) return null;

    // Get current complete data (including content) [获取当前完整数据 (含 content)]
    const current = await this.getNoteById(id);
    if (!current) return null;
    // Deleted notes are read-only: a stale debounced save must not write back
    // to a trashed note [已删除笔记拒绝更新：迟到的防抖保存不得写回回收站中的笔记]
    if (current.isDeleted) return null;

    // Merge updates [合并更新]
    const updated: Note = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Save to file system [保存到文件系统]
    const result = await noteApi.save(updated);
    if (result.success) {
      // Update cache (metadata only) [更新缓存 (仅元数据部分)]
      const { content, ...metaOnly } = updated;
      this.notesCache![index] = metaOnly;
      return updated;
    } else {
      const msg = result.error || 'Unknown error';
      console.error('更新笔记失败:', msg);
      return null;
    }
  }

  /** Soft delete (move to trash) [软删除 (移回收站)] */
  async deleteNote(id: string): Promise<boolean> {
    if (!this.initialized) await this.init();
    const result = await noteApi.delete(id);
    if (result.success) {
      // Optimistic cache update: avoids a full list IPC round-trip after delete [乐观更新缓存：省去删除后的全量 list IPC 往返]
      const cached = this.notesCache!.find(note => note.id === id);
      if (cached) { cached.isDeleted = true; cached.deletedAt = new Date().toISOString(); }
      return true;
    }
    return false;
  }

  /** Restore from trash [从回收站恢复] */
  async restoreNote(id: string): Promise<boolean> {
    if (!this.initialized) await this.init();
    const result = await noteApi.restore(id);
    if (result.success) {
      const cached = this.notesCache!.find(note => note.id === id);
      if (cached) { cached.isDeleted = false; cached.deletedAt = null; }
      return true;
    }
    return false;
  }

  /** Permanently delete (physically remove files) [永久删除 (物理删除文件)] */
  async permanentlyDeleteNote(id: string): Promise<boolean> {
    if (!this.initialized) await this.init();
    const result = await noteApi.permanentDelete(id);
    if (result.success) {
      this.notesCache = this.notesCache!.filter(note => note.id !== id);
      return true;
    }
    return false;
  }

  // ==================== Batch operations (optimistic cache, no full reload) [批量操作 (乐观更新缓存，不全量重读)] ====================

  /** Batch soft-delete (move to trash), returns count succeeded [批量软删除 (移回收站)，返回成功数] */
  async deleteNotes(ids: string[]): Promise<number> {
    if (!this.initialized) await this.init();
    let count = 0;
    for (const id of ids) {
      const result = await noteApi.delete(id);
      if (result.success) {
        count++;
        const cached = this.notesCache!.find(note => note.id === id);
        if (cached) { cached.isDeleted = true; cached.deletedAt = new Date().toISOString(); }
      }
    }
    return count;
  }

  /** Batch restore from trash, returns count succeeded [批量从回收站恢复，返回成功数] */
  async restoreNotes(ids: string[]): Promise<number> {
    if (!this.initialized) await this.init();
    let count = 0;
    for (const id of ids) {
      const result = await noteApi.restore(id);
      if (result.success) {
        count++;
        const cached = this.notesCache!.find(note => note.id === id);
        if (cached) { cached.isDeleted = false; cached.deletedAt = null; }
      }
    }
    return count;
  }

  /** Batch permanent delete, returns count succeeded [批量永久删除，返回成功数] */
  async permanentlyDeleteNotes(ids: string[]): Promise<number> {
    if (!this.initialized) await this.init();
    let count = 0;
    for (const id of ids) {
      const result = await noteApi.permanentDelete(id);
      if (result.success) {
        count++;
        this.notesCache = this.notesCache!.filter(note => note.id !== id);
      }
    }
    return count;
  }

  /** Refresh cache (exposed for settings page / manual refresh) [刷新缓存 (对外暴露，设置页/手动刷新用)] */
  async refresh(): Promise<NoteMeta[] | null> {
    await this.loadFromFS();
    return this.notesCache;
  }

  /** Debug utility [调试] */
  async debug(): Promise<NoteMeta[] | null> {
    await this.loadFromFS();
    console.log('=== 存储调试 (文件系统) ===');
    console.log('笔记总数:', this.notesCache!.length);
    console.log('活跃笔记:', this.notesCache!.filter(note => !note.isDeleted).length);
    console.log('回收站笔记:', this.notesCache!.filter(note => note.isDeleted).length);
    return this.notesCache;
  }
}

const storageManager = new StorageManager();
export default storageManager;
