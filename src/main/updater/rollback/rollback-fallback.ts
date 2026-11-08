// Rollback: corrupted cache cleanup + no-cache fallback [回滚 - 损坏缓存清理与无缓存兜底]

import * as fs from 'fs-extra';
import * as cacheManager from 'sparklet/main/updater/cache/cache-manager.js';
import { promptRendererDialog, broadcastToast } from 'sparklet/main/updater/dialog/dialog.js';
import { openReleasePage } from 'sparklet/main/updater/rollback/rollback-release.js';
import type { VerifyCachedZipResult } from 'sparklet/shared/types/updater/updater.js';

/**
 * Remove a corrupted cached zip (hash mismatch) [删除损坏的缓存包 (哈希不匹配)]
 */
export async function removeCorruptedCache(verifyResult: VerifyCachedZipResult, versionWithV: string): Promise<void> {
  if (verifyResult.reason && verifyResult.reason.startsWith('hash-mismatch') && verifyResult.zipPath) {
    try {
      await fs.remove(verifyResult.zipPath);
      await cacheManager.clearCacheByVersion(versionWithV);
      console.log('[Rollback] Removed corrupted cached zip');
    } catch { /* ignore [忽略] */ }
  }
}

/**
 * Fallback: prompt user to download from the official release page [兜底：提示用户去官方 release 下载]
 */
export async function promptOfficialDownload(
  versionWithV: string,
  errors: string[],
  releaseUrl: string
): Promise<void> {
  // First show Toast (i18n key) [先弹 Toast (i18n key)]
  broadcastToast({ key: 'updater.rollback.toastCorruptedNoCache' }, 'error', 12000);
  // 0=download from official, 1=OK [0=去官网下载, 1=确定]
  const choice = await promptRendererDialog('rollback-no-cache', {
    version: versionWithV,
    errors: errors || [],
    releaseUrl
  });
  if (choice.buttonIndex === 0) {
    openReleasePage(releaseUrl);
  }
}
