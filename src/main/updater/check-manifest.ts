// Release asset validation (tag format, zip filename, manifest URL) [Release 资产校验 (tag 格式、zip 文件名、manifest URL)]

import { extractAssetsFromRelease, type ReleaseData } from './manifest-helper';
import type { NetworkErrorType } from '../../shared/types/updater';

const TAG_PATTERN = /^v\d+\.\d+\.\d+$/;
const ZIP_FILENAME_PATTERN = /^sparklet-v\d+\.\d+\.\d+-win-x86_64\.zip$/;

/** Release validation result [Release 校验结果] */
export interface ReleaseValidationResult {
  valid: boolean;
  latestVersion: string;
  zipUrl: string | null;
  manifestUrl: string | null;
  error: string | null;
  errorType: NetworkErrorType | null;
}

/**
 * Validate release tag format and assets [校验 Release tag 格式与资产]
 * @returns Validation result with extracted URLs and version [校验结果，含提取的 URL 与版本号]
 */
export function validateRelease(data: ReleaseData | null): ReleaseValidationResult {
  const latestTag = data?.tag_name || '';
  const latestVersion = latestTag.startsWith('v') ? latestTag.slice(1) : latestTag;
  const { zipUrl, manifestUrl } = extractAssetsFromRelease(data);

  if (!latestTag.startsWith('v')) {
    return { valid: false, latestVersion, zipUrl: null, manifestUrl: null, error: `Invalid tag format: ${latestTag} does not start with 'v'`, errorType: 'unknown' };
  }
  if (!TAG_PATTERN.test(latestTag)) {
    return { valid: false, latestVersion, zipUrl: null, manifestUrl: null, error: `Invalid tag format: ${latestTag} does not match vX.X.X`, errorType: 'unknown' };
  }
  if (zipUrl) {
    const zipFileName = zipUrl.split('/').pop() || '';
    if (!ZIP_FILENAME_PATTERN.test(zipFileName)) {
      return { valid: false, latestVersion, zipUrl: null, manifestUrl: null, error: `Invalid zip filename: ${zipFileName}`, errorType: 'unknown' };
    }
  } else {
    // No update package found — not an error, just no update [无更新包——非错误，仅表示无更新]
    return { valid: false, latestVersion, zipUrl: null, manifestUrl: null, error: null, errorType: null };
  }
  if (!manifestUrl) {
    return { valid: false, latestVersion, zipUrl: null, manifestUrl: null, error: 'manifest.releases.json not found', errorType: 'unknown' };
  }
  return { valid: true, latestVersion, zipUrl, manifestUrl, error: null, errorType: null };
}
