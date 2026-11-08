// Note data types - barrel [笔记数据类型 - 汇总出口]
// Split out [已拆分]：entity → note-entity.ts, CRUD results → note-crud-result.ts,
// history → note-history-types.ts, integrity → note-integrity-types.ts.

export type { Note, NoteMeta } from 'sparklet/shared/types/note/note-entity.js';
export type {
  NoteListResult,
  NoteGetResult,
  NoteSaveResult,
  NoteOperationResult,
  NoteSearchResult,
} from 'sparklet/shared/types/note/note-crud-result.js';
export type {
  NoteSnapshot,
  NoteHistoryEntry,
  NoteHistoryResult,
  NoteSnapshotResult,
} from 'sparklet/shared/types/note/note-history-types.js';
export type { NoteIntegrityReport, NoteIntegrityReportResult } from 'sparklet/shared/types/note/note-integrity-types.js';
