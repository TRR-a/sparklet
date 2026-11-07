// Temp directory management: acquire, clean, release - barrel [临时目录管理：获取、清理、释放 - 汇总出口]
//
// Split out [已拆分]：clean → temp-clean.ts, dialogs → temp-dialogs.ts,
// manual pick → temp-manual-dir.ts, acquire → temp-acquire.ts, release → temp-release.ts.

export { cleanDirectory } from './temp-clean.js';
export type { TempDirDialogs } from './temp-dialogs.js';
export { acquireTempDir } from './temp-acquire.js';
export { releaseTempDir } from './temp-release.js';
