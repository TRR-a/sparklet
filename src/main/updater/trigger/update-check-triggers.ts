// Update check triggers - barrel [更新检查触发 - 汇总出口]
// Pending, auto, manual [待处理、自动、手动]
//
// Split out [已拆分]：pending → update-check-pending.ts,
// auto → update-check-auto.ts, manual → update-check-manual.ts.

export { checkPendingUpdate } from './update-check-pending.js';
export { autoCheckUpdate } from './update-check-auto.js';
export { checkUpdateManually } from './update-check-manual.js';
