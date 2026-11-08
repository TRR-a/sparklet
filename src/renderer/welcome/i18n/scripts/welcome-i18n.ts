// Kernel welcome i18n (kernel-scope strings) [内核欢迎页 i18n (内核域字符串)]
//
// Split out [已拆分]：string packs → welcome-i18n-strings.ts,
// language state → welcome-i18n-state.ts, DOM apply → welcome-i18n-apply.ts.

import { STRINGS } from 'sparklet/renderer/welcome/i18n/scripts/welcome-i18n-strings.js';
import { readLang } from 'sparklet/renderer/welcome/i18n/scripts/welcome-i18n-state.js';

export { getLang, setLang } from 'sparklet/renderer/welcome/i18n/scripts/welcome-i18n-state.js';
export { applyI18n } from 'sparklet/renderer/welcome/i18n/scripts/welcome-i18n-apply.js';

export function t(key: string): string {
  const lang = readLang();
  const pack = STRINGS[lang] ?? STRINGS.en;
  return pack[key] ?? STRINGS.en[key] ?? key;
}
