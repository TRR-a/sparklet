// Startup integrity self-check of the running executable [运行中可执行文件的启动完整性自检]
//
// Split out [已拆分]：manifest loading → self-check-manifest.ts,
// exe hash comparison → self-check-hash.ts.

import { app } from 'electron';
import { getHashField } from 'sparklet/main/updater/install/verify.js';
import { loadCurrentManifestForSelfCheck } from 'sparklet/main/updater/integrity/self-check-manifest.js';
import { compareExeHash } from 'sparklet/main/updater/integrity/self-check-hash.js';

/** Integrity self-check result [完整性自检结果] */
interface IntegrityResult {
  success: boolean;
  error: string | null;
}

/**
 * Startup integrity self-check: verify the running exe has not been tampered with [启动时完整性自检：校验当前运行的 exe 文件是否被篡改]
 * Uses external manifest.current.json (same directory as exe) [使用外挂的 manifest.current.json (与 exe 同目录)]
 * Uses exeHash first, falls back to hash [优先用 exeHash，回退到 hash]
 */
export async function selfCheckIntegrity(): Promise<IntegrityResult> {
  console.log('[Verify] Running startup integrity self-check');

  if (!app.isPackaged) {
    console.log('[Verify] Development environment, skipping self-check');
    return { success: true, error: null };
  }

  const currentManifest = await loadCurrentManifestForSelfCheck();

  if (!currentManifest) {
    console.warn('[Verify] manifest.current.json not found, skipping self-check');
    return { success: true, error: null };
  }

  const expectedExeHash = getHashField(currentManifest, 'exeHash');
  if (!expectedExeHash) {
    console.warn('[Verify] manifest.current.json missing exeHash/hash field, skipping self-check');
    return { success: true, error: null };
  }

  return compareExeHash(expectedExeHash);
}
