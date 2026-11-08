// Updater rollback handler [更新器回滚处理]
// Called when file integrity check fails, tries to reinstall from cache or prompts official download [文件完整性校验失败时调用，尝试从缓存重装或提示官网下载]
//
// Split out [已拆分]：types → rollback-types.ts, release URL → rollback-release.ts,
// reinstall → rollback-reinstall.ts, fallback → rollback-fallback.ts,
// cached-zip branch → rollback-cache-branch.ts.

import * as cacheManager from 'sparklet/main/updater/cache/cache-manager.js';
import { computeSha256 } from 'sparklet/main/updater/install/verify.js';
import { buildReleaseUrl } from 'sparklet/main/updater/rollback/rollback-release.js';
import { removeCorruptedCache, promptOfficialDownload } from 'sparklet/main/updater/rollback/rollback-fallback.js';
import { handleRollbackWithCache } from 'sparklet/main/updater/rollback/rollback-cache-branch.js';
import type { RollbackContext } from 'sparklet/main/updater/rollback/rollback-types.js';

export type { PendingUpdateInfo, RollbackContext } from 'sparklet/main/updater/rollback/rollback-types.js';

/**
 * Rollback handling: called after file integrity check failure [回滚处理：文件完整性校验失败后调用]
 * 1. First check if persistent cache has ZIP for current version [先查持久缓存中有没有当前版本的 ZIP]
 * 2. If found and intact → ask user if they want to reinstall from cached ZIP [若有且校验完好 → 弹窗问用户要不要用缓存 ZIP 直接重装]
 * 3. If cached ZIP is corrupted → delete corrupted file, prompt user to download from official site [若缓存 ZIP 损坏 → 删掉损坏文件，弹窗提示用户去官网下载]
 */
export async function handleIntegrityRollback(
  currentVersion: string,
  errors: string[],
  ctx: RollbackContext
): Promise<void> {
  const versionWithV = `v${currentVersion}`;
  const githubReleaseUrl = buildReleaseUrl(versionWithV);

  // Check cache first [先看缓存里有没有]
  const verifyResult = await cacheManager.verifyCachedZip(versionWithV, computeSha256);

  if (verifyResult.ok && verifyResult.zipPath) {
    await handleRollbackWithCache(
      versionWithV, verifyResult.zipPath, githubReleaseUrl, currentVersion, errors, ctx
    );
    return;
  }

  // No available cache: if cached ZIP is corrupted, remove it first [没有可用缓存：若缓存 ZIP 损坏则先清掉损坏的]
  await removeCorruptedCache(verifyResult, versionWithV);

  // Fallback to "prompt to download from official" [走「提示去官网」的兜底]
  await promptOfficialDownload(versionWithV, errors, githubReleaseUrl);
}
