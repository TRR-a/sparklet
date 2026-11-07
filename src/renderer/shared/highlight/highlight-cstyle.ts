// C-style highlighter - TS/JS/CSS/Python via dialect config [C 风格高亮 - 通过方言配置支持 TS/JS/CSS/Python]
//
// Split out [已拆分]：dialect tables → highlight-cstyle-dialects.ts,
// token regex → highlight-cstyle-tokenize.ts, template interpolation → highlight-cstyle-template.ts,
// word classification → highlight-cstyle-word.ts, scan loop → highlight-cstyle-scan.ts.

import type { CStyleDialect } from './highlight-cstyle-dialects.js';
import { buildCStyleTokenRe, buildCStyleWordRe } from './highlight-cstyle-tokenize.js';
import { scanCStyle } from './highlight-cstyle-scan.js';

export type { CStyleDialect };
export { C_STYLE_DIALECTS } from './highlight-cstyle-dialects.js';

/** Highlight a C-style language in one pass [单遍高亮 C 风格语言] */
export function highlightCStyle(code: string, dialect: CStyleDialect): string {
  return scanCStyle(code, dialect, buildCStyleTokenRe(dialect), buildCStyleWordRe(dialect));
}
