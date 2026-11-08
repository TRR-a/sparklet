// Config directory: resolve across candidates [配置目录 - 跨候选解析]

import { app } from 'electron';
import { CONFIG_DIR_NAMES } from 'sparklet/main/updater/constants/constants.js';
import type { ConfigDirResult } from 'sparklet/main/updater/config/config-dir-types.js';
import { tryConfigDir } from 'sparklet/main/updater/config/config-dir-try.js';

/** Walk the candidate list until one directory works [逐个尝试候选目录直到可用] */
export async function resolveConfigDir(): Promise<ConfigDirResult> {
  const userData = app.getPath('userData');

  for (const dirName of CONFIG_DIR_NAMES) {
    const result = await tryConfigDir(userData, dirName);
    if (result) return result;
  }

  const errorMsg = 'Unable to access any config directory. Please check permissions.';
  console.error('[ConfigManager]', errorMsg);
  return { success: false, path: null, error: errorMsg };
}
