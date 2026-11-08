// Verify: layer 2 - package SHA256 [校验 - 第二层：更新包 SHA256]

import * as fs from 'fs-extra';
import { computeSha256, getHashField } from './hash-utils.js';
import type { ManifestEntry } from 'sparklet/shared/types/updater/updater.js';

/**
 * Layer 2 verification: verify downloaded package SHA256 matches expected hash [第二层校验：验证下载的更新包 SHA256 是否与预期一致]
 * Uses entry.packageHash first, falls back to entry.hash [优先用 entry.packageHash，回退到 entry.hash]
 */
export async function verifyPackageIntegrity(zipPath: string, entry: ManifestEntry): Promise<{ success: boolean; error: string | null; errorType?: string }> {
  const expectedHash = getHashField(entry, 'packageHash');
  console.log('[Verify] Layer 2: Computing SHA256 of downloaded package');
  try {
    if (!expectedHash) {
      console.warn('[Verify] packageHash missing, skipping package integrity check');
      return { success: true, error: null };
    }
    const exists = await fs.pathExists(zipPath);
    if (!exists) {
      return { success: false, error: 'Downloaded package file not found' };
    }
    const actualHash = await computeSha256(zipPath);
    console.log('[Verify] Actual package hash:', actualHash.slice(0, 16) + '...');
    console.log('[Verify] Expected package hash:', expectedHash.slice(0, 16) + '...');
    if (actualHash !== expectedHash) {
      return {
        success: false,
        error: `Package SHA256 mismatch: expected ${expectedHash}, got ${actualHash}`,
        errorType: 'unknown'
      };
    }
    console.log('[Verify] Layer 2 passed');
    return { success: true, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Verification error: ${msg}` };
  }
}
