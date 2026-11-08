// Storage: create a note [存储 - 创建笔记]

import type { Note } from 'sparklet/shared/types/note/notes.js';
import { noteApi } from '../../../app/api/note-api.js';
import { ensureInit } from '../storage-cache.js';

/** Create a new note (persist to file system) [创建新笔记 (物理文件落盘)] */
export async function createNote(title: string = '无标题', color: string = '#4285f4'): Promise<Note> {
  const cache = await ensureInit();

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
    starred: false,
    tags: []
  };

  // Save to file system via IPC [调用 IPC 保存到文件系统]
  const result = await noteApi.save(newNote);
  if (result.success) {
    const { content, ...meta } = newNote;
    cache.push(meta);
    return newNote;
  } else {
    const msg = result.error || 'Unknown error';
    console.error('创建笔记失败:', msg);
    throw new Error(msg);
  }
}
