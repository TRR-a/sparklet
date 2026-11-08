// Storage manager: batch soft-delete [存储管理器 - 批量软删除]

import { noteApi } from '../../../app/api/note-api.js';
import { ensureInit } from '../storage-cache.js';

/** Batch soft-delete (move to trash), returns count succeeded [批量软删除 (移回收站)，返回成功数] */
export async function deleteNotes(ids: string[]): Promise<number> {
  const cache = await ensureInit();
  let count = 0;
  for (const id of ids) {
    const result = await noteApi.delete(id);
    if (result.success) {
      count++;
      const cached = cache.find(note => note.id === id);
      if (cached) { cached.isDeleted = true; cached.deletedAt = new Date().toISOString(); }
    }
  }
  return count;
}
