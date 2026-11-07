// Cache: verify cached zip hash [缓存 - 校验缓存包哈希]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getUpdateCacheDir } from '../core/updater-paths.js';
import { readMeta } from './cache-meta.js';
import type { VerifyCachedZipResult } from 'sparklet/shared/types/updater';

/**
 * Quick check if cached ZIP for a version is intact (compare packageHash) [快速检查缓存中指定版本的 ZIP 是否完好 (对比 packageHash)]
 * @param computeSha256Fn Optional SHA256 function (injected to avoid circular dep with verify.ts) [可选的 SHA256 函数 (注入以避免与 verify.ts 循环依赖)]
 */
export async function verifyCachedZip(
  version: string,
  computeSha256Fn?: ((filePath: string) => Promise<string>) | null
): Promise<VerifyCachedZipResult> {
  const meta = await readMeta();
  const entry = meta.versions[version];
  if (!entry || !entry.zipFilename || !entry.packageHash) {
    return { ok: false, zipPath: null, reason: 'no-entry-or-hash' };
  }
  const zipPath = path.join(getUpdateCacheDir(), entry.zipFilename);
  const exists = await fs.pathExists(zipPath);
  if (!exists) {
    return { ok: false, zipPath, reason: 'zip-missing' };
  }
  if (!computeSha256Fn) {
    return { ok: true, zipPath, packageHash: entry.packageHash, reason: 'no-hash-check' };
  }
  try {
    const actualHash = await computeSha256Fn(zipPath);
    if (actualHash !== entry.packageHash) {
      return { ok: false, zipPath, reason: 'hash-mismatch', actualHash, expectedHash: entry.packageHash };
    }
    return { ok: true, zipPath, packageHash: entry.packageHash };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, zipPath, reason: 'hash-error:' + msg };
  }
}
