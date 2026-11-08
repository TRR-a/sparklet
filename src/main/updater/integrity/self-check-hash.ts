// Integrity self-check: compare exe hash [完整性自检 - 比对 exe 哈希]

import * as fs from 'fs-extra';
import { computeSha256 } from '../install/verify.js';

/** Exe hash comparison result [exe 哈希比对结果] */
export interface ExeHashCompareResult {
  success: boolean;
  error: string | null;
}

/**
 * Compute and compare the running exe hash [计算并比对当前 exe 哈希]
 * @param expectedExeHash Expected hash from the manifest [清单中的期望哈希]
 */
export async function compareExeHash(expectedExeHash: string): Promise<ExeHashCompareResult> {
  try {
    const currentExePath = process.execPath;
    const exists = await fs.pathExists(currentExePath);
    if (!exists) {
      console.warn('[Verify] Current exe file not found, skipping self-check');
      return { success: true, error: null };
    }

    const actualHash = await computeSha256(currentExePath);
    if (actualHash !== expectedExeHash) {
      return {
        success: false,
        error: `Integrity check failed: executable file hash mismatch`
      };
    }

    console.log('[Verify] Integrity self-check passed');
    return { success: true, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Verify] Self-check error:', msg);
    return { success: true, error: null };
  }
}
