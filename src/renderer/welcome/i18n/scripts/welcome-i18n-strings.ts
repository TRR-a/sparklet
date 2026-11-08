// Kernel welcome i18n: string packs [内核欢迎页 i18n - 字符串包]
//
// Split out [已拆分]：en → welcome-i18n-strings-en.ts, zh-CN → welcome-i18n-strings-zh.ts.

import { STRINGS_EN } from 'sparklet/renderer/welcome/i18n/scripts/welcome-i18n-strings-en.js';
import { STRINGS_ZH_CN } from 'sparklet/renderer/welcome/i18n/scripts/welcome-i18n-strings-zh.js';

export const STRINGS: Record<string, Record<string, string>> = {
  en: STRINGS_EN,
  'zh-CN': STRINGS_ZH_CN,
};
