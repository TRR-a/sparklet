// Updater config import: per-field validation + merge - barrel [更新配置导入 - 逐字段校验与合并 - 汇总出口]
//
// Split out [已拆分]：allow-lists → updater-config-import-set.ts,
// merge → updater-config-import-merge.ts.

export { ALLOWED_BEHAVIORS, LEGAL_INTERVALS, IMPORT_WHITE_LIST } from './updater-config-import-set.js';
export { mergeImportedConfig } from './updater-config-import-merge.js';
