// Note history: read/list snapshots - barrel [笔记历史 - 读取/列出快照 - 汇总出口]
//
// Split out [已拆分]：list → note-history-list.ts,
// snapshot read → note-history-snapshot-read.ts,
// newest lookup → note-history-latest.ts.

export { listHistory } from 'sparklet/main/services/note/history/note-history-list.js';
export { getSnapshot } from 'sparklet/main/services/note/history/note-history-snapshot-read.js';
export { getLatestSnapshot } from 'sparklet/main/services/note/history/note-history-latest.js';
