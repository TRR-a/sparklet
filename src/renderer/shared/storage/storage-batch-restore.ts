// Storage manager: batch restore from trash [存储管理器 - 批量恢复]

import { noteApi } from '../../app/api/note-api.js';
import { ensureInit } from './storage-cache.js';

/** Batch restore from trash, returns count succeeded [批量从回收站恢复，返回成功数] */
export async function restoreNotes(ids: string[]): Promise<number> {
  const cache = await ensureInit();
  let count = 0;
  for (const id of ids) {
    const result = await noteApi.restore(id);
    if (result.success) {
      count++;
      const cached = cache.find(note => note.id === id);
      if (cached) { cached.isDeleted = false; cached.deletedAt = null; }
    }
  }
  return count;
}
