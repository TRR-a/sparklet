// Config file path resolution [配置文件路径解析]

import * as path from 'path';
import { getConfigDir } from 'sparklet/main/updater/config/config-dir.js';

/**
 * Get config file path [获取配置文件路径]
 */
export async function getConfigFilePath(): Promise<string | null> {
  const result = await getConfigDir();
  if (!result.success) return null;
  return path.join(result.path!, 'settings.json');
}
