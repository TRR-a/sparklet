// Note history: snapshot store (write + prune) - barrel [笔记历史 - 快照存储 (写入+修剪) - 汇总出口]
//
// Split out [已拆分]：tokens & session bookkeeping → note-history-ts.ts,
// write/prune → note-history-snapshot-write.ts,
// interval gate → note-history-snapshot-maybe.ts.

export { listSnapshotTs, lastSnapshotAt, makeTsToken } from 'sparklet/main/services/note/history/note-history-ts.js';
export { snapshotNote } from 'sparklet/main/services/note/history/note-history-snapshot-write.js';
export { maybeSnapshotOnSave } from 'sparklet/main/services/note/history/note-history-snapshot-maybe.js';
