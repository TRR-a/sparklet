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

import * as fs from 'fs-extra';
import * as path from 'path';
import { ensureNotesDir } from './note-paths';
import { getLatestSnapshot } from './note-history';
import { writeFileAtomic } from './note-io';
import type { Note, NoteIntegrityReport, NoteIntegrityReportResult } from '../../shared/types/notes';

/** Cached report of the last startup scan [最近一次启动扫描的缓存报告] */
let lastReport: NoteIntegrityReport | null = null;

/**
 * Read the cached startup scan report [读取缓存的启动扫描报告]
 */
export function getIntegrityReport(): NoteIntegrityReportResult {
  if (!lastReport) {
    return { success: true, report: { repairedNotes: 0, quarantinedNotes: [], cleanedTmpFiles: 0 } };
  }
  return { success: true, report: lastReport };
}

/**
 * Run the startup integrity scan [执行启动完整性扫描]
 */
export async function runStartupIntegrityScan(): Promise<NoteIntegrityReport> {
  const report: NoteIntegrityReport = { repairedNotes: 0, quarantinedNotes: [], cleanedTmpFiles: 0 };
  try {
    const notesDir = await ensureNotesDir();
    const entries = await fs.readdir(notesDir, { withFileTypes: true });

    // 1. Clean leftover atomic-write temp files [清理原子写入残留临时文件]
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.tmp')) {
        try {
          await fs.remove(path.join(notesDir, entry.name));
          report.cleanedTmpFiles++;
        } catch (err) {
          console.warn(`[NoteIntegrity] failed to remove tmp file ${entry.name}:`, err);
        }
      }
    }

    // 2. Verify each note .json parses [校验每个笔记 .json 可解析]
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const id = entry.name.replace('.json', '');
      const jsonPath = path.join(notesDir, entry.name);

      let valid = false;
      try {
        const meta = await fs.readJson(jsonPath);
        valid = Boolean(meta && typeof meta === 'object' && meta.id);
      } catch {
        valid = false;
      }
      if (valid) continue;

      console.warn(`[NoteIntegrity] corrupt note json detected: ${entry.name}`);
      const snapshot = await getLatestSnapshot(id);
      if (snapshot && snapshot.note) {
        // Rebuild both files from the snapshot [从快照重建两个文件]
        const note: Note = { ...snapshot.note, updatedAt: snapshot.note.updatedAt || snapshot.savedAt };
        const { content, ...meta } = note;
        await writeFileAtomic(jsonPath, JSON.stringify(meta, null, 2));
        await writeFileAtomic(path.join(notesDir, `${id}.md`), content || '');
        report.repairedNotes++;
        console.log(`[NoteIntegrity] repaired note ${id} from snapshot ${snapshot.ts}`);
      } else {
        // No snapshot: quarantine so it is visible instead of silently skipped
        // [无快照：隔离，使其可见而非被静默跳过]
        try {
          await fs.rename(jsonPath, `${jsonPath}.corrupt`);
          report.quarantinedNotes.push(id);
          console.warn(`[NoteIntegrity] quarantined ${entry.name} -> ${entry.name}.corrupt (no snapshot)`);
        } catch (err) {
          console.warn(`[NoteIntegrity] quarantine failed for ${entry.name}:`, err);
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NoteIntegrity] scan error:', msg);
  }

  lastReport = report;
  if (report.repairedNotes > 0 || report.quarantinedNotes.length > 0 || report.cleanedTmpFiles > 0) {
    console.log(`[NoteIntegrity] startup scan done: repaired=${report.repairedNotes}, quarantined=${report.quarantinedNotes.length}, tmpCleaned=${report.cleanedTmpFiles}`);
  }
  return report;
}
