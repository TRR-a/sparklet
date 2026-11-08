// Updater dialog content: rollback variants - barrel [更新器弹窗内容 - 回滚各分支 汇总出口]
//
// Split out [已拆分]：cache branch → rollback-cache-view.ts,
// restart branch → rollback-restart-view.ts,
// no-cache branch → rollback-no-cache-view.ts,
// shared error block → rollback-errors-block.ts.

export { buildRollbackWithCache } from '../../rollback/rollback-cache-view.js';
export { buildRollbackRestart } from '../../rollback/rollback-restart-view.js';
export { buildRollbackNoCache } from '../../rollback/rollback-no-cache-view.js';
