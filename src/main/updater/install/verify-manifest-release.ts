// Verify: layer 1 - release manifest entry [校验 - 第一层：release 清单条目]

import { fetchReleasesManifest } from '../manifest/manifest-helper.js';
import { normalizeVersion } from './hash-utils.js';
import type { VerifyResult } from 'sparklet/shared/types/updater/updater.js';

/**
 * Layer 1 verification: fetch target version info from manifest.releases.json [第一层校验：从 manifest.releases.json 获取目标版本的完整信息]
 */
export async function verifyReleaseManifest(manifestUrl: string, targetVersion: string): Promise<VerifyResult> {
  console.log('[Verify] Layer 1: Fetching manifest.releases.json');
  const releases = await fetchReleasesManifest(manifestUrl);
  if (!releases) {
    return { success: false, error: 'Unable to fetch manifest.releases.json', entry: null };
  }
  const targetEntry = releases.find(item =>
    normalizeVersion(item.version) === normalizeVersion(targetVersion)
  );
  if (!targetEntry) {
    return {
      success: false,
      error: `Version ${targetVersion} not found in manifest`,
      entry: null
    };
  }
  const hasAnyHash = targetEntry.packageHash || targetEntry.exeHash || targetEntry.filesHash || targetEntry.hash;
  if (!hasAnyHash) {
    return {
      success: false,
      error: `Version ${targetVersion} manifest entry missing all hash fields`,
      entry: null
    };
  }
  console.log('[Verify] Layer 1 passed, entry:', {
    version: targetEntry.version,
    packageHash: targetEntry.packageHash ? targetEntry.packageHash.slice(0, 16) + '...' : (targetEntry.hash ? targetEntry.hash.slice(0, 16) + '...' : 'missing'),
    internalCodename: targetEntry.internalCodename || 'N/A'
  });
  return { success: true, entry: targetEntry, error: null };
}
