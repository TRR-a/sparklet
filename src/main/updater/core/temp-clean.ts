// Temp dir: clean helpers [临时目录 - 清理辅助]

import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Clean all items in a directory (keep the directory itself) [清理目录内所有条目 (保留目录本身)]
 * @param dirPath Directory path to clean [待清理的目录路径]
 * @returns Whether cleaning succeeded [是否清理成功]
 */
export async function cleanDirectory(dirPath: string): Promise<boolean> {
  try {
    const exists = await fs.pathExists(dirPath);
    if (!exists) return true;
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      await fs.remove(itemPath);
    }
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[TempManager] Clean directory failed:', dirPath, msg);
    return false;
  }
}
