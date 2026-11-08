// Temp directory: candidate probing [临时目录 - 候选探测]

import * as fs from 'fs-extra';
import * as path from 'path';
import { TEMP_DIR_NAMES } from '../constants/constants.js';
import type { TempDirResult } from 'sparklet/shared/types/updater/updater.js';
import { cleanDirectory } from './temp-clean.js';

/** Try each candidate directory in order; null when none is usable [按顺序尝试每个候选目录；全部不可用时返回 null] */
export async function tryTempCandidates(tempBase: string): Promise<TempDirResult | null> {
  for (const dirName of TEMP_DIR_NAMES) {
    const fullPath = path.join(tempBase, dirName);
    try {
      const exists = await fs.pathExists(fullPath);
      if (!exists) {
        await fs.ensureDir(fullPath);
        console.log('[TempManager] Created temp directory:', fullPath);
        return { success: true, path: fullPath, isManual: false };
      } else {
        const cleaned = await cleanDirectory(fullPath);
        if (cleaned) {
          console.log('[TempManager] Reused and cleaned temp directory:', fullPath);
          return { success: true, path: fullPath, isManual: false };
        }
        console.warn('[TempManager] Clean failed, trying next:', fullPath);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[TempManager] Access error:', fullPath, msg);
    }
  }
  return null;
}
