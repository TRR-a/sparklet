// Update flow: prepare (manifest → confirm → temp dir → download → verify → cache) [更新流程 - 准备阶段 (清单→确认→临时目录→下载→校验→缓存)]
//
// Split out [已拆分]：outcome type → update-flow-prepare-types.ts,
// manifest/confirm → update-flow-prepare-manifest.ts, temp dir → update-flow-prepare-temp.ts,
// download/integrity → update-flow-prepare-download.ts, cache sync → update-flow-prepare-cache.ts.

import { runManifestConfirmStep } from 'sparklet/main/updater/flow/prepare/update-flow-prepare-manifest.js';
import { runTempDirStep } from 'sparklet/main/updater/flow/prepare/update-flow-prepare-temp.js';
import { runDownloadStep } from 'sparklet/main/updater/flow/prepare/update-flow-prepare-download.js';
import { runCacheSyncStep } from 'sparklet/main/updater/flow/prepare/update-flow-prepare-cache.js';
import type { PrepareOutcome } from 'sparklet/main/updater/flow/prepare/update-flow-prepare-types.js';

export type { PrepareOutcome } from 'sparklet/main/updater/flow/prepare/update-flow-prepare-types.js';

/**
 * Prepare the update package: verify manifest, confirm, download, verify integrity, cache [准备更新包：清单校验、确认、下载、完整性校验、缓存]
 */
export async function prepareUpdatePackage(params: {
  currentVersion: string;
  latestVersion: string;
  zipUrl: string | null;
  manifestUrl: string | null;
  onProgress?: (msg: string, percent: number) => void;
}): Promise<PrepareOutcome> {
  const { currentVersion, latestVersion, zipUrl, manifestUrl, onProgress } = params;

  const manifestStep = await runManifestConfirmStep(currentVersion, latestVersion, manifestUrl, onProgress);
  if (manifestStep.status !== 'ok') return manifestStep;

  const tempStep = await runTempDirStep(onProgress);
  if (tempStep.status !== 'ok') return tempStep;

  const downloadStep = await runDownloadStep(
    latestVersion, zipUrl, manifestStep.entry, tempStep.tempDir, tempStep.isManualDir, onProgress
  );
  if (downloadStep.status !== 'ok') return downloadStep;

  await runCacheSyncStep(latestVersion, downloadStep.zipPath, manifestStep.entry, onProgress);

  onProgress && onProgress('Ready to install...', 90);
  return {
    status: 'ok',
    tempDir: tempStep.tempDir,
    isManualDir: tempStep.isManualDir,
    zipPath: downloadStep.zipPath,
    entry: manifestStep.entry,
  };
}
