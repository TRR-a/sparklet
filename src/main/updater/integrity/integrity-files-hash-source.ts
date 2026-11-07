// Installed files verify: expected hash source [已安装文件校验 - 期望哈希来源]

import { fetchReleasesManifest, readCurrentManifest } from '../core/manifest-helper.js';
import { getHashField, normalizeVersion } from '../core/verify.js';

/** Expected files hash and where it came from [期望的文件哈希及其来源] */
export interface ExpectedFilesHash {
  hash: string | null;
  source: 'cloud' | 'local' | null;
}

/**
 * Resolve the expected filesHash (cloud manifest first, local fallback)
 * [解析期望的 filesHash (云端 manifest 优先，本地兜底)]
 */
export async function resolveExpectedFilesHash(currentVersion: string): Promise<ExpectedFilesHash> {
  let expectedFilesHash: string | null = null;
  let hashSource: 'cloud' | 'local' | null = null;

  try {
    const manifestUrl = `https://github.com/TRR-a/sparklet/releases/download/v${currentVersion}/manifest.releases.json`;
    const releases = await fetchReleasesManifest(manifestUrl);
    if (releases && Array.isArray(releases)) {
      const targetEntry = releases.find(item =>
        normalizeVersion(item.version) === normalizeVersion(currentVersion)
      );
      const fHash = getHashField(targetEntry, 'filesHash');
      if (fHash) {
        expectedFilesHash = fHash;
        hashSource = 'cloud';
        console.log('[Verify] Using cloud manifest for files integrity check');
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log('[Verify] Cloud manifest fetch failed:', msg);
  }

  if (!expectedFilesHash) {
    try {
      const localManifest = await readCurrentManifest();
      const fHash = getHashField(localManifest, 'filesHash');
      if (fHash) {
        expectedFilesHash = fHash;
        hashSource = 'local';
        console.log('[Verify] Using local manifest for files integrity check');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log('[Verify] Local manifest read failed:', msg);
    }
  }

  return { hash: expectedFilesHash, source: hashSource };
}
