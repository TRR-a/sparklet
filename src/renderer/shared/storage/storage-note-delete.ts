// Storage: soft delete a note [存储 - 软删除笔记]

import { noteApi } from '../../app/api/note-api.js';
import { ensureInit } from './storage-cache.js';

/** Soft delete (move to trash) [软删除 (移回收站)] */
export async function deleteNote(id: string): Promise<boolean> {
  const cache = await ensureInit();
  const result = await noteApi.delete(id);
  if (result.success) {
    // Optimistic cache update: avoids a full list IPC round-trip after delete [乐观更新缓存：省去删除后的全量 list IPC 往返]
    const cached = cache.find(note => note.id === id);
    if (cached) { cached.isDeleted = true; cached.deletedAt = new Date().toISOString(); }
    return true;
  }
  return false;
}
