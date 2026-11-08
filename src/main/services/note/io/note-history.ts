// Note history - version snapshots under notes/.history/{id}/ [笔记历史 - notes/.history/{id}/ 下的版本快照]
//
// Snapshot policy [快照策略]：
//   - maybeSnapshotOnSave: at most one snapshot per note per 10 minutes of saving
//     (in-memory map; a process restart re-baselines on first save)
//     [保存时每笔记最多每 10 分钟快照一次 (内存映射；进程重启后首次保存重建基线)]
//   - snapshotNote: unconditional snapshot (used before delete / restore)
//     [无条件快照 (删除/恢复前调用)]
//   - Pruned to MAX_SNAPSHOTS_PER_NOTE (oldest first) [每笔记最多保留 N 张，超出修剪最旧的]
//
// Snapshot files are full copies (title + content + meta) named {ms}-{rand}.json
// [快照文件为全量拷贝 (标题+正文+元数据)，文件名 {ms}-{rand}.json]
//
// Split out [已拆分]：store/write → note-history-store.ts,
// read/list → note-history-read.ts, cleanup → note-history-clear.ts.

export { snapshotNote, maybeSnapshotOnSave } from 'sparklet/main/services/note/history/note-history-store.js';
export { listHistory, getSnapshot, getLatestSnapshot } from 'sparklet/main/services/note/history/note-history-read.js';
export { removeHistory, clearAllHistory } from 'sparklet/main/services/note/history/note-history-clear.js';
