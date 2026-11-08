// Note integrity scan report types [笔记完整性扫描报告类型]

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
