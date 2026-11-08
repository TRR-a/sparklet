// Rollback: stage a cached zip into a temp dir [回滚 - 把缓存包拷入临时目录]

import * as path from 'path';
import * as fs from 'fs-extra';
import { acquireTempDir, releaseTempDir } from '../temp/temp-manager.js';
import { promptRendererDialog, broadcastToast } from '../dialog/dialog.js';

/** Result of staging a cached zip [缓存包暂存结果] */
export interface StagedZipResult {
  ok: boolean;
  tempZipPath: string | null;
  tempDir: string | null;
  isManual: boolean;
}

/**
 * Copy the cached zip into an acquired temp dir; reports errors to the user on failure
 * [把缓存 ZIP 拷入已获取的临时目录；失败时向用户报错]
 */
export async function stageCachedZip(cachedZipPath: string): Promise<StagedZipResult> {
  const tempResult = await acquireTempDir();
  if (!tempResult.success) {
    // showErrorBox simple error: use broadcastToast + simple-error dialog [showErrorBox 简单错误：走 broadcastToast + simple-error 弹窗]
    broadcastToast({ key: 'updater.rollback.errorCreateTempDir' }, 'error', 8000);
    await promptRendererDialog('simple-error', {
      titleKey: 'updater.rollback.errorCreateTempDir.title',
      bodyKey: 'updater.rollback.errorCreateTempDir.body'
    }).catch(() => {});
    return { ok: false, tempZipPath: null, tempDir: null, isManual: false };
  }
  // Copy cached ZIP to temp dir to avoid operating on cache directory itself [把缓存 ZIP 拷一份到临时目录，避免对缓存目录本身操作]
  const tempZipPath = path.join(tempResult.path!, path.basename(cachedZipPath));
  try {
    await fs.copy(cachedZipPath, tempZipPath);
  } catch (err) {
    console.error('[Rollback] Failed to copy cached zip to temp:', err);
    broadcastToast({ key: 'updater.rollback.errorCopyCache' }, 'error', 8000);
    await promptRendererDialog('simple-error', {
      titleKey: 'updater.rollback.errorCopyCache.title',
      bodyKey: 'updater.rollback.errorCopyCache.body',
      detail: err instanceof Error ? err.message : String(err)
    }).catch(() => {});
    await releaseTempDir(tempResult.path, tempResult.isManual);
    return { ok: false, tempZipPath: null, tempDir: null, isManual: false };
  }
  return {
    ok: true,
    tempZipPath,
    tempDir: tempResult.path!,
    isManual: tempResult.isManual,
  };
}
