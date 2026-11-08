// Note history / snapshot types [笔记历史与快照类型]

import type { Note } from './note-entity.js';

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
