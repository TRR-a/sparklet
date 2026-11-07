// Updater startup: executable self-check [更新器启动 - 可执行文件自检]

import { selfCheckIntegrity } from '../integrity/integrity-self-check.js';
import { getCurrentVersion } from '../check/check.js';
import { handleIntegrityRollback } from './rollback.js';
import { updaterStateInternal } from './update-state.js';

/** Run the executable self-check; failure also goes through rollback [执行可执行文件自检；失败同样走回滚] */
export function runStartupSelfCheck(): void {
  selfCheckIntegrity().then(async (result) => {
    if (!result.success) {
      console.warn('[Updater] Integrity self-check warning:', result.error);
      // exe corrupted/tampered: also go through rollback (reinstall from cache if intact, otherwise prompt official download) [exe 损坏/篡改：同样走回滚流程 (缓存完好则重装，否则提示官网下载)]
      try {
        const version = getCurrentVersion();
        await handleIntegrityRollback(version, [result.error || '可执行文件完整性校验失败'], {
          setPendingUpdate: (u) => { updaterStateInternal.pendingUpdate = u; }
        });
      } catch (err) {
        console.error('[Updater] Self-check rollback failed:', err);
      }
    }
  });
}
