// Updater config import: validation + merge rules - barrel [更新配置导入 - 校验与合并规则 - 汇总出口]
//
// Split out [已拆分]：field rules & merge → updater-config-import-fields.ts,
// payload extraction → updater-config-import-payload.ts.

export {
  ALLOWED_BEHAVIORS,
  LEGAL_INTERVALS,
  IMPORT_WHITE_LIST,
  mergeImportedConfig
} from 'sparklet/main/ipc/update/config/updater-config-import-fields.js';
export { extractConfigPayload } from 'sparklet/main/ipc/update/config/updater-config-import-payload.js';
