// Update flow: prepare - download & integrity [更新流程 - 准备：下载与完整性校验]

import * as path from 'path';
import * as fs from 'fs-extra';
import type { ManifestEntry } from 'sparklet/shared/types/updater/updater.js';
import { MAX_RETRY_COUNT } from '../../constants/constants.js';
import { releaseTempDir } from '../../temp/temp-manager.js';
import { downloadWithRetry } from '../../download/download.js';
import { verifyPackageIntegrity } from '../../install/verify.js';

/** Result of the download/integrity step [下载与校验步骤结果] */
export type DownloadResult =
  | { status: 'download-failed'; error: string | null; errorType: string | null }
  | { status: 'integrity-failed'; error: string | null; errorType: string | null }
  | { status: 'ok'; zipPath: string };

/** Download the zip and verify its integrity [下载 zip 并校验完整性] */
export async function runDownloadStep(
  latestVersion: string,
  zipUrl: string | null,
  entry: ManifestEntry,
  tempDir: string,
  isManualDir: boolean,
  onProgress?: (msg: string, percent: number) => void
): Promise<DownloadResult> {
  onProgress && onProgress('Downloading update package...', 10);
  const zipFileName = `sparklet-v${latestVersion}-win-x86_64.zip`;
  const zipPath = path.join(tempDir, zipFileName);

  const downloadResult = await downloadWithRetry(zipUrl!, zipPath, (percent) => {
    const progress = 10 + Math.round(percent * 0.5);
    onProgress && onProgress(`Downloading... ${percent}%`, progress);
  }, MAX_RETRY_COUNT);
  if (!downloadResult.success) {
    await releaseTempDir(tempDir, isManualDir);
    return {
      status: 'download-failed',
      error: downloadResult.error,
      errorType: (downloadResult.errorType as string | null) ?? null,
    };
  }

  onProgress && onProgress('Verifying file integrity...', 80);
  const integrityResult = await verifyPackageIntegrity(zipPath, entry);
  if (!integrityResult.success) {
    await fs.remove(zipPath).catch(() => {});
    await releaseTempDir(tempDir, isManualDir);
    return {
      status: 'integrity-failed',
      error: integrityResult.error as string,
      errorType: (integrityResult.errorType as string | null) ?? null,
    };
  }

  return { status: 'ok', zipPath };
}
