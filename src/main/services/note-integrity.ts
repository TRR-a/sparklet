// Note integrity - startup scan & self-repair for the notes directory [笔记完整性 - 笔记目录的启动扫描与自修复]
//
// Runs once at app startup (before any renderer can query notes) [应用启动时运行一次 (先于任何渲染进程查询笔记)]：
//   1. Remove leftover atomic-write temp files (*.tmp) [清理原子写入残留的临时文件]
//   2. For each corrupt {id}.json: rebuild .json + .md from the newest history
//      snapshot [损坏的 {id}.json 从最新历史快照重建 .json + .md]
//   3. If no snapshot exists: quarantine as {id}.json.corrupt so it is no longer
//      silently skipped by listNotes [无快照则隔离为 {id}.json.corrupt，不再被列表静默跳过]
// The report is cached and served to the renderer for a user-visible toast
// [报告缓存后供渲染进程查询，向用户展示提示]
//
// Split out [已拆分]：report cache → note-integrity-report.ts,
// tmp cleanup → note-integrity-tmp-clean.ts, repair → note-integrity-repair.ts,
// per-note verification → note-integrity-verify.ts.

import * as fs from 'fs-extra';
import { ensureNotesDir } from './note-paths';
import { cleanedTmpFileNames } from './note-integrity-helpers.js';
import type { NoteIntegrityReport } from 'sparklet/shared/types/notes';
import { setIntegrityReport, emptyIntegrityReport } from './note-integrity-report.js';
import { cleanTmpFiles } from './note-integrity-tmp-clean.js';
import { verifyNoteFiles } from './note-integrity-verify.js';

export { getIntegrityReport } from './note-integrity-report.js';

/**
 * Run the startup integrity scan [执行启动完整性扫描]
 */
export async function runStartupIntegrityScan(): Promise<NoteIntegrityReport> {
  const report: NoteIntegrityReport = emptyIntegrityReport();
  try {
    const notesDir = await ensureNotesDir();
    const entries = await fs.readdir(notesDir, { withFileTypes: true });

    // 1. Clean leftover atomic-write temp files [清理原子写入残留临时文件]
    report.cleanedTmpFiles = await cleanTmpFiles(notesDir, cleanedTmpFileNames(entries));

    // 2. Verify and repair each note json [校验并修复每个笔记 json]
    await verifyNoteFiles(notesDir, entries, report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NoteIntegrity] scan error:', msg);
  }

  setIntegrityReport(report);
  if (report.repairedNotes > 0 || report.quarantinedNotes.length > 0 || report.cleanedTmpFiles > 0) {
    console.log(`[NoteIntegrity] startup scan done: repaired=${report.repairedNotes}, quarantined=${report.quarantinedNotes.length}, tmpCleaned=${report.cleanedTmpFiles}`);
  }
  return report;
}
