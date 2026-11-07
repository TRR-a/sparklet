// Updater config import: allow-lists [更新配置导入 - 合法取值集合]

import {
  DEFAULT_CONFIG,
  INTERVAL_OPTIONS
} from '../updater/core/constants.js';

/** Legal update behaviors [合法的更新行为取值] */
export const ALLOWED_BEHAVIORS = new Set(['auto', 'notify-only', 'disabled']);
/** Legal check intervals [合法的检查间隔] */
export const LEGAL_INTERVALS = new Set(INTERVAL_OPTIONS.map(o => o.value).concat([0]));
/** Keys allowed to be imported [允许导入的键] */
export const IMPORT_WHITE_LIST = new Set(Object.keys(DEFAULT_CONFIG));
