// Storage manager: refresh + debug [存储管理器 - 刷新与调试]

import type { NoteMeta } from 'sparklet/shared/types/note/notes.js';
import { loadFromFS, getCache } from './storage-cache.js';

/** Refresh cache (exposed for settings page / manual refresh) [刷新缓存 (对外暴露，设置页/手动刷新用)] */
export async function refresh(): Promise<NoteMeta[] | null> {
  await loadFromFS();
  return getCache();
}

/** Debug utility [调试] */
export async function debug(): Promise<NoteMeta[] | null> {
  await loadFromFS();
  const cache = getCache()!;
  console.log('=== 存储调试 (文件系统) ===');
  console.log('笔记总数:', cache.length);
  console.log('活跃笔记:', cache.filter(note => !note.isDeleted).length);
  console.log('回收站笔记:', cache.filter(note => note.isDeleted).length);
  return cache;
}
