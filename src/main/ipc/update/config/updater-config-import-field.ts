// Updater config import: single-field merge [更新配置导入 - 单字段合并]

import type { UpdaterConfig } from 'sparklet/shared/types/updater/updater.js';
import { ALLOWED_BEHAVIORS, LEGAL_INTERVALS } from 'sparklet/main/ipc/update/config/updater-config-import-set.js';
import { clampRetentionDays, normalizeLastCheckTime } from 'sparklet/main/ipc/update/config/updater-config-import-normalize.js';

/** Apply one whitelisted key onto the merged config (unknown keys are ignored) [把一个白名单键应用到合并结果] */
export function mergeOneField(merged: UpdaterConfig, key: string, v: unknown): void {
  switch (key) {
    case 'updateBehavior':
      if (ALLOWED_BEHAVIORS.has(String(v))) {
        merged.updateBehavior = String(v) as UpdaterConfig['updateBehavior'];
      }
      break;
    case 'checkInterval': {
      const n = Number(v);
      if (Number.isFinite(n) && LEGAL_INTERVALS.has(n)) merged.checkInterval = n;
      break;
    }
    case 'autoDownload':
      merged.autoDownload = !!v;
      break;
    case 'integrityCheck':
      merged.integrityCheck = !!v;
      break;
    case 'cacheRetentionDays': {
      const days = clampRetentionDays(v);
      if (days !== null) merged.cacheRetentionDays = days;
      break;
    }
    case 'lastCheckTime': {
      const result = normalizeLastCheckTime(v);
      if (result.valid) merged.lastCheckTime = result.iso;
      break;
    }
    default:
      // Skip unknown keys [跳过未知键]
      break;
  }
}
