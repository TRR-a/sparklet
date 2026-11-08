// Storage manager: read queries [存储管理器 - 读查询]

import type { Note, NoteMeta } from 'sparklet/shared/types/note/notes.js';
import { noteApi } from 'sparklet/renderer/app/api/note-api.js';
import { ensureInit } from 'sparklet/renderer/shared/storage/storage-cache.js';

/** Return non-deleted notes [返回未删除的笔记] */
export async function getNotes(): Promise<NoteMeta[]> {
  const cache = await ensureInit();
  return cache.filter(note => !note.isDeleted);
}

/** Return all notes (including deleted) [返回所有笔记 (含已删除)] */
export async function getAllNotes(): Promise<NoteMeta[]> {
  const cache = await ensureInit();
  return [...cache];
}

/** Return trash notes [返回回收站笔记] */
export async function getTrashNotes(): Promise<NoteMeta[]> {
  const cache = await ensureInit();
  return cache.filter(note => note.isDeleted);
}

/** Get a single note by ID (with content) [按 ID 获取单篇笔记 (含正文)] */
export async function getNoteById(id: string): Promise<Note | null> {
  await ensureInit();
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
