// Manifest: download manifest.releases.json [清单 - 下载 releases 清单]
//
// Split out [已拆分]：request options + parsing → manifest-fetch-options.ts.

import * as https from 'https';
import type { ManifestEntry } from 'sparklet/shared/types/updater';
import { buildManifestRequestOptions, parseManifestBody } from './manifest-fetch-options.js';

/**
 * Download manifest.releases.json from GitHub [从 GitHub 下载 manifest.releases.json]
 * @param downloadUrl Asset download URL [附件下载地址]
 * @returns Full object array, or null [完整对象数组，或 null]
 */
export async function fetchReleasesManifest(downloadUrl: string): Promise<ManifestEntry[] | null> {
  return new Promise((resolve) => {
    const options = buildManifestRequestOptions(downloadUrl);
    const req = https.get(options, (res) => {
      if (res.statusCode !== 200) {
        console.error('[ManifestHelper] Fetch manifest failed, status:', res.statusCode);
        resolve(null);
        return;
      }
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk; });
      res.on('end', () => {
        resolve(parseManifestBody(data));
      });
    });
    req.on('error', (err: Error) => {
      console.error('[ManifestHelper] Request error:', err.message);
      resolve(null);
    });
    req.on('timeout', () => {
      req.destroy();
      console.error('[ManifestHelper] Request timeout');
      resolve(null);
    });
  });
}
