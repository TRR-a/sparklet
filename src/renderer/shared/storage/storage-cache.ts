// Storage manager: note metadata cache + FS load [存储管理器 - 笔记元数据缓存与文件系统加载]

import type { NoteMeta } from 'sparklet/shared/types/notes';
import { noteApi } from '../../app/api/note-api.js';

let notesCache: NoteMeta[] | null = null;
let initialized = false;

/** Read the raw metadata cache [读取原始元数据缓存] */
export function getCache(): NoteMeta[] | null {
  return notesCache;
}

/** Replace the metadata cache [替换元数据缓存] */
export function setCache(next: NoteMeta[] | null): void {
  notesCache = next;
}

/** Initialize: load all notes from file system [初始化：从文件系统加载所有笔记] */
export async function initStore(): Promise<NoteMeta[] | null> {
  if (initialized) return notesCache;
  await loadFromFS();
  initialized = true;
  return notesCache;
}

/** Load from file system and cache [从文件系统加载并缓存] */
export async function loadFromFS(): Promise<NoteMeta[]> {
  try {
    const result = await noteApi.list();
    if (result.success && result.notes) {
      notesCache = result.notes;
    } else {
      console.error('加载笔记列表失败:', result.error);
      notesCache = [];
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('加载笔记异常:', msg);
    notesCache = [];
  }
  return notesCache;
}

/** Ensure the cache is initialized and return it [确保缓存已初始化并返回] */
export async function ensureInit(): Promise<NoteMeta[]> {
  if (!initialized) await initStore();
  return notesCache!;
}
