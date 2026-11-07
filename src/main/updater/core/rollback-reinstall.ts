// Rollback: reinstall from cached zip [回滚 - 用缓存包重装]
//
// Split out [已拆分]：temp staging → rollback-reinstall-stage.ts.

import { app } from 'electron';
import { promptRendererDialog } from '../dialog/dialog.js';
import { stageCachedZip } from './rollback-reinstall-stage.js';
import type { RollbackContext } from './rollback-types.js';

/**
 * Reinstall from a verified cached zip (copies into temp dir, then asks restart/later)
 * [用校验通过的缓存包重装 (先拷入临时目录，再问立即重启或稍后)]
 */
export async function reinstallFromCache(
  versionWithV: string,
  cachedZipPath: string,
  currentVersion: string,
  errors: string[],
  ctx: RollbackContext
): Promise<void> {
  console.log('[Rollback] User chose rollback from cached zip:', cachedZipPath);

  const staged = await stageCachedZip(cachedZipPath);
  if (!staged.ok) return;

  ctx.setPendingUpdate({
    zipPath: staged.tempZipPath!,
    tempDir: staged.tempDir!,
    isManualDir: staged.isManual,
    targetVersion: currentVersion
  });
  // 0=restart and reinstall now, 1=later (reinstall on exit) [0=立即重启重装, 1=稍后 (退出时重装)]
  const restartChoice = await promptRendererDialog('rollback-restart', {
    version: versionWithV
  });
  if (restartChoice.buttonIndex === 0) {
    setTimeout(() => app.quit(), 300);
  }
}
