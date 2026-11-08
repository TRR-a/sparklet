// Config directory: try one candidate [配置目录 - 尝试单个候选]

import * as fs from 'fs-extra';
import * as path from 'path';
import type { ConfigDirResult } from 'sparklet/main/updater/config/config-dir-types.js';

/** Try creating/accessing one candidate directory; null means "keep trying" [尝试创建或访问单个候选目录；null 表示继续尝试下一个] */
export async function tryConfigDir(userData: string, dirName: string): Promise<ConfigDirResult | null> {
  const fullPath = path.join(userData, dirName);
  try {
    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      await fs.ensureDir(fullPath);
      console.log('[ConfigManager] Created config directory:', fullPath);
      return { success: true, path: fullPath, error: null };
    }
    await fs.access(fullPath, fs.constants.R_OK | fs.constants.W_OK);
    console.log('[ConfigManager] Using existing config directory:', fullPath);
    return { success: true, path: fullPath, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[ConfigManager] Cannot access', fullPath, ':', msg);
    return null;
  }
}
