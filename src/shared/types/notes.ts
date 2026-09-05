// Note data types [笔记数据类型]

/** Full note with content [含正文的完整笔记] */
export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  pinned: boolean;
  starred: boolean;
}

/** Note metadata without content [不含正文的笔记元数据] */
export type NoteMeta = Omit<Note, 'content'>;

/** Result of listing notes [笔记列表结果] */
export interface NoteListResult {
  success: boolean;
  notes?: NoteMeta[];
  error?: string;
}

/** Result of getting a single note [获取单篇笔记结果] */
export interface NoteGetResult {
  success: boolean;
  note?: Note;
  error?: string;
}

/** Result of saving a note [保存笔记结果] */
export interface NoteSaveResult {
  success: boolean;
  note?: Note;
  error?: string;
}

/** Result of note operations (delete/restore/permanentDelete) [笔记操作结果 (删除/恢复/永久删除)] */
export interface NoteOperationResult {
  success: boolean;
  error?: string;
}

/** Result of full-text search (title + content) [全文搜索结果 (标题 + 正文)] */
export interface NoteSearchResult {
  success: boolean;
  notes?: NoteMeta[];
  error?: string;
}

/** Full snapshot file content stored under .history/{id}/ [存放于 .history/{id}/ 的完整快照文件] */
export interface NoteSnapshot {
  /** Snapshot token (fs-safe timestamp, used as filename) [快照令牌 (文件系统安全的时间戳，用作文件名)] */
  ts: string;
  /** ISO time when the snapshot was taken [快照创建时间] */
  savedAt: string;
  /** Full note state at snapshot time [快照时刻的完整笔记] */
  note: Note;
}

/** History list entry (without content) [历史列表条目 (不含正文)] */
export interface NoteHistoryEntry {
  ts: string;
  savedAt: string;
  title: string;
  charCount: number;
}

/** Result of listing note history [笔记历史列表结果] */
export interface NoteHistoryResult {
  success: boolean;
  entries?: NoteHistoryEntry[];
  error?: string;
}

/** Result of reading one snapshot [读取单份快照结果] */
export interface NoteSnapshotResult {
  success: boolean;
  snapshot?: NoteSnapshot;
  error?: string;
}

/** Startup integrity scan report [启动完整性扫描报告] */
export interface NoteIntegrityReport {
  /** Notes rebuilt from history snapshots [从历史快照修复的笔记数] */
  repairedNotes: number;
  /** Note IDs quarantined as .corrupt (no snapshot available) [被隔离为 .corrupt 的笔记 ID (无可用快照)] */
  quarantinedNotes: string[];
  /** Leftover atomic-write temp files removed [清理的原子写入残留临时文件数] */
  cleanedTmpFiles: number;
}

/** Result of querying the integrity report [查询完整性报告结果] */
export interface NoteIntegrityReportResult {
  success: boolean;
  report?: NoteIntegrityReport;
  error?: string;
}
