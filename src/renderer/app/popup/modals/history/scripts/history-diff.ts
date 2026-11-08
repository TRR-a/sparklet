// Line diff for history snapshots - barrel [历史快照行级差异 - 汇总出口]
//
// Split out [已拆分]：LCS computation → history-diff-lines.ts,
// rendering → history-diff-render.ts.

export type { DiffLine } from 'sparklet/renderer/app/popup/modals/history/scripts/history-diff-lines.js';
export { diffLines } from 'sparklet/renderer/app/popup/modals/history/scripts/history-diff-lines.js';
export { renderDetail } from 'sparklet/renderer/app/popup/modals/history/scripts/history-diff-render.js';
