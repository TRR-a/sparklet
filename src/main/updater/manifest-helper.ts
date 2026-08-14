// Manifest file reading and parsing (full object, no field validation) [清单文件读取与解析 (完整对象，不做字段校验)]

import * as fs from 'fs-extra';
import * as path from 'path';
import * as https from 'https';
import { URL } from 'url';
import { getAppRoot } from './constants';
import type { ManifestEntry } from '../../shared/types/updater';

/**
 * Read the bundled manifest.current.json [读取随应用打包的 manifest.current.json]
 * @returns Full object, or null if file missing/parse failed [完整对象，或 null (文件不存在/解析失败)]
 */
export async function readCurrentManifest(): Promise<ManifestEntry | null> {
  const manifestPath = path.join(getAppRoot(), 'manifest.current.json');
  try {
    const exists = await fs.pathExists(manifestPath);
    if (!exists) {
      console.warn('[ManifestHelper] manifest.current.json not found');
      return null;
    }
    const content = await fs.readFile(manifestPath, 'utf-8');
    const data = JSON.parse(content) as ManifestEntry;
    // Return full object directly, no field validation [直接返回完整对象，不做字段校验]
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ManifestHelper] Read manifest.current.json failed:', msg);
    return null;
  }
}

/**
 * Download manifest.releases.json from GitHub [从 GitHub 下载 manifest.releases.json]
 * @param downloadUrl Asset download URL [附件下载地址]
 * @returns Full object array, or null [完整对象数组，或 null]
 */
export async function fetchReleasesManifest(downloadUrl: string): Promise<ManifestEntry[] | null> {
  return new Promise((resolve) => {
    const urlObj = new URL(downloadUrl);
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: { 'User-Agent': 'Sparklet-Updater', 'Accept': 'application/json' },
      timeout: 10000
    };
    const req = https.get(options, (res) => {
      if (res.statusCode !== 200) {
        console.error('[ManifestHelper] Fetch manifest failed, status:', res.statusCode);
        resolve(null);
        return;
      }
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            console.warn('[ManifestHelper] Invalid manifest format, expecting non-empty array');
            resolve(null);
            return;
          }
          // Return full array directly, no field validation [直接返回完整数组，不做字段校验]
          resolve(parsed as ManifestEntry[]);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('[ManifestHelper] Parse manifest failed:', msg);
          resolve(null);
        }
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

/** Asset extraction result [Asset 提取结果] */
export interface AssetExtractionResult {
  zipUrl: string | null;
  manifestUrl: string | null;
  tagName: string | null;
}

/** GitHub release asset object [GitHub Release asset 对象] */
interface ReleaseAsset {
  name?: string;
  browser_download_url?: string;
}

/** GitHub release data object [GitHub Release 数据对象] */
export interface ReleaseData {
  tag_name?: string;
  assets?: ReleaseAsset[];
}

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
