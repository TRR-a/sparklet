// Storage: restore a note from trash [存储 - 从回收站恢复笔记]

import { noteApi } from 'sparklet/renderer/app/api/note-api.js';
import { ensureInit } from 'sparklet/renderer/shared/storage/storage-cache.js';

/** Restore from trash [从回收站恢复] */
export async function restoreNote(id: string): Promise<boolean> {
  const cache = await ensureInit();
  const result = await noteApi.restore(id);
  if (result.success) {
    const cached = cache.find(note => note.id === id);
    if (cached) { cached.isDeleted = false; cached.deletedAt = null; }
    return true;
  }
  return false;
}
