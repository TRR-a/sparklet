// Manifest asset extraction & entry exports [清单 Asset 提取与入口导出]
// Types in manifest-types.ts, file IO in manifest-fetch.ts [类型在 manifest-types.ts，文件读写于 manifest-fetch.ts]

import type { AssetExtractionResult, ReleaseData } from 'sparklet/main/updater/manifest/manifest-types.js';

export type { AssetExtractionResult, ReleaseData } from 'sparklet/main/updater/manifest/manifest-types.js';
export { readCurrentManifest, fetchReleasesManifest } from 'sparklet/main/updater/manifest/manifest-fetch.js';

/**
 * Extract asset download URLs from GitHub Release data [从 GitHub Release 数据中提取 asset 下载地址]
 * @param releaseData GitHub API release data [GitHub API 返回的 release 数据]
 * @returns Extraction result with zipUrl, manifestUrl, tagName [提取结果]
 */
export function extractAssetsFromRelease(releaseData: ReleaseData | null): AssetExtractionResult {
  if (!releaseData || !releaseData.assets || !Array.isArray(releaseData.assets)) {
    return { zipUrl: null, manifestUrl: null, tagName: null };
  }
  const tagName = releaseData.tag_name || null;
  let zipUrl: string | null = null;
  let manifestUrl: string | null = null;
  for (const asset of releaseData.assets) {
    const name = asset.name || '';
    if (name === 'manifest.releases.json') {
      manifestUrl = asset.browser_download_url || null;
    } else if (name.match(/^sparklet-v\d+\.\d+\.\d+-win-x86_64\.zip$/)) {
      zipUrl = asset.browser_download_url || null;
    }
  }
  return { zipUrl, manifestUrl, tagName };
}
