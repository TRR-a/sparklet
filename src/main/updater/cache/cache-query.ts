// Cache: resolve cached zip path [缓存 - 解析缓存包路径]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getUpdateCacheDir } from '../core/updater-paths.js';
import { readMeta } from './cache-meta.js';

/**
 * Get cached ZIP absolute path for a version (if exists and has meta record) [获取指定版本的缓存 ZIP 绝对路径 (如果存在且 meta 中有记录)]
 * No integrity check, only returns path; caller can verify with packageHash [不做完整性校验，只返回路径；调用方可自行用 packageHash 校验]
 */
export async function getCachedZipPath(version: string): Promise<string | null> {
  const meta = await readMeta();
  const entry = meta.versions[version];
  if (!entry || !entry.zipFilename) return null;
  const zipPath = path.join(getUpdateCacheDir(), entry.zipFilename);
  const exists = await fs.pathExists(zipPath);
  if (!exists) return null;
  return zipPath;
}
