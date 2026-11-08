// Temp directory: release [临时目录 - 释放]

import * as fs from 'fs-extra';
import { cleanDirectory } from './temp-clean.js';

/**
 * Release a temp directory (clean or remove based on acquisition mode) [释放临时目录 (根据获取方式清理或删除)]
 * @param dirPath Directory path to release [待释放的目录路径]
 * @param isManual Whether the directory was manually specified [是否为手动指定的目录]
 */
export async function releaseTempDir(dirPath: string | null, isManual: boolean = false): Promise<void> {
  if (!dirPath) return;
  try {
    if (isManual) {
      await fs.remove(dirPath);
      console.log('[TempManager] Removed manual temp directory:', dirPath);
    } else {
      await cleanDirectory(dirPath);
      console.log('[TempManager] Cleaned temp directory:', dirPath);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[TempManager] Release failed:', dirPath, msg);
  }
}
