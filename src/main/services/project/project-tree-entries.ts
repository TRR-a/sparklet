// Project tree reader: directory entry listing [项目树读取 - 目录条目列举]

import * as fs from 'fs-extra';
import * as path from 'path';
import { SKIP_DIRS } from 'sparklet/main/services/project/project-tree-skip.js';

/** One directory listing split into sorted dirs and files [一次目录列举，拆分为已排序的目录与文件] */
export interface SortedEntries {
  dirs: string[];
  files: string[];
}

/**
 * List a directory, skipping excluded dirs, sorted: directories first then files, alphabetically
 * [列举目录，跳过排除项，排序：目录在前、文件在后，按字母序]
 */
export async function listSortedEntries(nodePath: string): Promise<SortedEntries> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(nodePath);
  } catch {
    // Permission denied or other error, return empty [权限不足或其他错误，返回空]
    return { dirs: [], files: [] };
  }

  // Filter out skipped dirs, sort: directories first, then files, alphabetically
  const dirs: string[] = [];
  const files: string[] = [];
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = path.join(nodePath, entry);
    try {
      const entryStat = await fs.stat(fullPath);
      if (entryStat.isDirectory()) {
        dirs.push(entry);
      } else {
        files.push(entry);
      }
    } catch {
      // Skip inaccessible entries [跳过不可访问的条目]
    }
  }
  dirs.sort((a, b) => a.localeCompare(b));
  files.sort((a, b) => a.localeCompare(b));
  return { dirs, files };
}
