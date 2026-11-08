// Updater config import: per-field merge [更新配置导入 - 逐字段合并]
//
// Split out [已拆分]：per-field switch → updater-config-import-field.ts,
// value normalizers → updater-config-import-normalize.ts.

import type { UpdaterConfig } from 'sparklet/shared/types/updater/updater.js';
import { IMPORT_WHITE_LIST } from './updater-config-import-set.js';
import { mergeOneField } from './updater-config-import-field.js';

/**
 * Merge imported raw config into the current base, applying per-field validation
 * [把导入的原始配置合并到当前基础配置，逐字段校验]
 */
export function mergeImportedConfig(raw: Record<string, unknown>, base: UpdaterConfig): UpdaterConfig {
  const merged: UpdaterConfig = { ...base };

  for (const key of Object.keys(raw)) {
    if (!IMPORT_WHITE_LIST.has(key)) continue;
    mergeOneField(merged, key, raw[key]);
  }
  return merged;
}
