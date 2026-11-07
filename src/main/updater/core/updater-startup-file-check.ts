// Updater startup: installed-file integrity check [更新器启动 - 已安装文件完整性校验]

import { verifyInstalledFiles } from '../integrity/integrity-files-verify.js';
import { getCurrentVersion } from '../check/check.js';
import { handleIntegrityRollback } from './rollback.js';
import { updaterStateInternal } from './update-state.js';

/** Verify installed files shortly after startup; failure triggers rollback [启动后稍候校验已安装文件；失败走回滚] */
export function scheduleStartupFileIntegrityCheck(): void {
  // ========== On startup: file integrity check (failure triggers rollback) ========== [启动时文件完整性校验 (失败则走回滚流程)]
  setTimeout(async () => {
    try {
      const currentVersion = getCurrentVersion();
      const result = await verifyInstalledFiles(currentVersion, (msg, pct) => {
        console.log(`[Verify] ${msg} (${pct}%)`);
      });
      if (!result.success) {
        console.warn('[Verify] Integrity check failed:', result.errors);
        // Switch to rollback flow (use cache if available, otherwise prompt to download from official) [改为走回滚流程 (有缓存用缓存，没缓存提示官网下载)]
        await handleIntegrityRollback(currentVersion, result.errors, {
          setPendingUpdate: (u) => { updaterStateInternal.pendingUpdate = u; }
        });
      }
    } catch (err) {
      console.error('[Verify] Integrity check error:', err);
    }
  }, 3000);
  // ========== End of startup file integrity check ========== [启动时文件完整性校验结束]
}
