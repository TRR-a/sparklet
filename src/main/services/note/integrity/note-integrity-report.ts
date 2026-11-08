// Note integrity: report cache [笔记完整性 - 报告缓存]

import type { NoteIntegrityReport, NoteIntegrityReportResult } from 'sparklet/shared/types/note/notes.js';

/** Cached report of the last startup scan [最近一次启动扫描的缓存报告] */
let lastReport: NoteIntegrityReport | null = null;

/** Store the report of the last scan [保存最近一次扫描的报告] */
export function setIntegrityReport(report: NoteIntegrityReport): void {
  lastReport = report;
}

/** Build an empty report [构造空报告] */
export function emptyIntegrityReport(): NoteIntegrityReport {
  return { repairedNotes: 0, quarantinedNotes: [], cleanedTmpFiles: 0 };
}

/**
 * Read the cached startup scan report [读取缓存的启动扫描报告]
 */
export function getIntegrityReport(): NoteIntegrityReportResult {
  if (!lastReport) {
    return { success: true, report: emptyIntegrityReport() };
  }
  return { success: true, report: lastReport };
}
