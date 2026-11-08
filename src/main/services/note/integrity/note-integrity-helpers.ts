// Note integrity: entry filters [笔记完整性 - 目录条目筛选]

import type { Dirent } from 'fs';

/** Names of leftover atomic-write temp files [原子写入残留临时文件名] */
export function cleanedTmpFileNames(entries: Dirent[]): string[] {
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tmp'))
    .map((entry) => entry.name);
}
