// Storage: update a note [存储 - 更新笔记]

import type { Note } from 'sparklet/shared/types/notes';
import { noteApi } from '../../app/api/note-api.js';
import { ensureInit } from './storage-cache.js';
import { getNoteById } from './storage-query.js';

/** Update a note [更新笔记] */
export async function updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
  const cache = await ensureInit();

  const index = cache.findIndex(note => note.id === id);
  if (index === -1) return null;

  // Get current complete data (including content) [获取当前完整数据 (含 content)]
  const current = await getNoteById(id);
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
    cache[index] = metaOnly;
    return updated;
  } else {
    const msg = result.error || 'Unknown error';
    console.error('更新笔记失败:', msg);
    return null;
  }
}
