// Updater rollback handler [更新器回滚处理]
// Called when file integrity check fails, tries to reinstall from cache or prompts official download [文件完整性校验失败时调用，尝试从缓存重装或提示官网下载]

import { app, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs-extra';
import { GITHUB_OWNER, GITHUB_REPO } from './constants';
import { acquireTempDir, releaseTempDir } from './temp-manager';
import * as cacheManager from './cache-manager';
import { computeSha256 } from './verify';
import { promptRendererDialog, broadcastToast } from './dialog';

/** Pending update info [待安装更新信息] */
export interface PendingUpdateInfo {
  zipPath: string;
  tempDir: string;
  isManualDir: boolean;
  targetVersion: string;
}

/** Rollback context for accessing updater state [回滚上下文，用于访问更新器状态] */
export interface RollbackContext {
  setPendingUpdate: (update: PendingUpdateInfo | null) => void;
}

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
  const githubReleaseUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tag/${versionWithV}`;

  // Check cache first [先看缓存里有没有]
  const verifyResult = await cacheManager.verifyCachedZip(versionWithV, computeSha256);

  if (verifyResult.ok && verifyResult.zipPath) {
    // Cache intact, ask user if they want to reinstall from cache [缓存完好，问用户要不要直接用缓存重装]
    // 0=reinstall from cache, 1=download from official, 2=later [0=用缓存重装, 1=去官网下载, 2=稍后再说]
    const choice = await promptRendererDialog('rollback-with-cache', {
      version: versionWithV,
      errors: errors || [],
      zipPath: verifyResult.zipPath
    });

    if (choice.buttonIndex === 0) {
      // User chose "reinstall from cache" [用户选了「使用缓存重新安装」]
      console.log('[Rollback] User chose rollback from cached zip:', verifyResult.zipPath);
      const tempResult = await acquireTempDir();
      if (!tempResult.success) {
        // showErrorBox simple error: use broadcastToast + simple-error dialog [showErrorBox 简单错误：走 broadcastToast + simple-error 弹窗]
        broadcastToast({ key: 'updater.rollback.errorCreateTempDir' }, 'error', 8000);
        await promptRendererDialog('simple-error', {
          titleKey: 'updater.rollback.errorCreateTempDir.title',
          bodyKey: 'updater.rollback.errorCreateTempDir.body'
        }).catch(() => {});
        return;
      }
      // Copy cached ZIP to temp dir to avoid operating on cache directory itself [把缓存 ZIP 拷一份到临时目录，避免对缓存目录本身操作]
      const tempZipPath = path.join(tempResult.path!, path.basename(verifyResult.zipPath));
      try {
        await fs.copy(verifyResult.zipPath, tempZipPath);
      } catch (err) {
        console.error('[Rollback] Failed to copy cached zip to temp:', err);
        broadcastToast({ key: 'updater.rollback.errorCopyCache' }, 'error', 8000);
        await promptRendererDialog('simple-error', {
          titleKey: 'updater.rollback.errorCopyCache.title',
          bodyKey: 'updater.rollback.errorCopyCache.body',
          detail: err instanceof Error ? err.message : String(err)
        }).catch(() => {});
        await releaseTempDir(tempResult.path, tempResult.isManual);
        return;
      }
      ctx.setPendingUpdate({
        zipPath: tempZipPath,
        tempDir: tempResult.path!,
        isManualDir: tempResult.isManual,
        targetVersion: currentVersion
      });
      // 0=restart and reinstall now, 1=later (reinstall on exit) [0=立即重启重装, 1=稍后 (退出时重装)]
      const restartChoice = await promptRendererDialog('rollback-restart', {
        version: versionWithV
      });
      if (restartChoice.buttonIndex === 0) {
        setTimeout(() => app.quit(), 300);
      }
      return;
    }

    if (choice.buttonIndex === 1) {
      // User chose "download from official" [用户选了「去官网下载」]
      shell.openExternal(githubReleaseUrl).catch(() => {});
      return;
    }
    // Chose "later" → no action [选了稍后再说 → 不操作]
    return;
  }

  // No available cache: if cached ZIP is corrupted, remove it first [没有可用缓存：若缓存 ZIP 损坏则先清掉损坏的]
  if (verifyResult.reason && verifyResult.reason.startsWith('hash-mismatch') && verifyResult.zipPath) {
    try {
      await fs.remove(verifyResult.zipPath);
      await cacheManager.clearCacheByVersion(versionWithV);
      console.log('[Rollback] Removed corrupted cached zip');
    } catch { /* ignore [忽略] */ }
  }

  // Fallback to "prompt to download from official" [走「提示去官网」的兜底]
  // First show Toast (i18n key) [先弹 Toast (i18n key)]
  broadcastToast({ key: 'updater.rollback.toastCorruptedNoCache' }, 'error', 12000);
  // 0=download from official, 1=OK [0=去官网下载, 1=确定]
  const choice = await promptRendererDialog('rollback-no-cache', {
    version: versionWithV,
    errors: errors || [],
    releaseUrl: githubReleaseUrl
  });
  if (choice.buttonIndex === 0) {
    shell.openExternal(githubReleaseUrl).catch(() => {});
  }
}
