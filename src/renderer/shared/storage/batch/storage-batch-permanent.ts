// Storage manager: permanent delete + cache read [存储管理器 - 永久删除与缓存读取]

import { noteApi } from '../../../app/api/note-api.js';
import { ensureInit, getCache, setCache } from '../storage-cache.js';

/** Batch permanent delete, returns count succeeded [批量永久删除，返回成功数] */
export async function permanentlyDeleteNotes(ids: string[]): Promise<number> {
  let cache = await ensureInit();
  let count = 0;
  for (const id of ids) {
    const result = await noteApi.permanentDelete(id);
    if (result.success) {
      count++;
      cache = cache.filter(note => note.id !== id);
      setCache(cache);
    }
  }
  return count;
}

/** Permanently delete a single note (physically remove files) [永久删除单篇 (物理删除文件)] */
export async function permanentlyDeleteNote(id: string): Promise<boolean> {
  const cache = await ensureInit();
  const result = await noteApi.permanentDelete(id);
  if (result.success) {
    const next = cache.filter(note => note.id !== id);
    setCache(next);
    return true;
  }
  return false;
}

/** Read the cached metadata array after init (used by debug) [初始化后读取缓存元数据] */
export async function readCache(): Promise<ReturnType<typeof getCache>> {
  await ensureInit();
  return getCache();
}
