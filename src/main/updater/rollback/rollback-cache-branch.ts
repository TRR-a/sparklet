// Rollback: cached-zip branch [回滚 - 缓存分支]

import { promptRendererDialog } from 'sparklet/main/updater/dialog/dialog.js';
import { openReleasePage } from 'sparklet/main/updater/rollback/rollback-release.js';
import { reinstallFromCache } from 'sparklet/main/updater/rollback/rollback-reinstall.js';
import type { RollbackContext } from 'sparklet/main/updater/rollback/rollback-types.js';

/**
 * Cache is intact: ask the user whether to reinstall or open the release page
 * [缓存完好：询问用户要缓存重装还是打开发布页]
 */
export async function handleRollbackWithCache(
  versionWithV: string,
  zipPath: string,
  githubReleaseUrl: string,
  currentVersion: string,
  errors: string[],
  ctx: RollbackContext
): Promise<void> {
  // 0=reinstall from cache, 1=download from official, 2=later [0=用缓存重装, 1=去官网下载, 2=稍后再说]
  const choice = await promptRendererDialog('rollback-with-cache', {
    version: versionWithV,
    errors: errors || [],
    zipPath
  });

  if (choice.buttonIndex === 0) {
    // User chose "reinstall from cache" [用户选了「使用缓存重新安装」]
    await reinstallFromCache(versionWithV, zipPath, currentVersion, errors, ctx);
    return;
  }

  if (choice.buttonIndex === 1) {
    // User chose "download from official" [用户选了「去官网下载」]
    openReleasePage(githubReleaseUrl);
    return;
  }
  // Chose "later" → no action [选了稍后再说 → 不操作]
}
