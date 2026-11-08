// Note integrity: corrupt note repair / quarantine [笔记完整性 - 损坏笔记修复与隔离]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getLatestSnapshot } from 'sparklet/main/services/note/io/note-history.js';
import { writeFileAtomic } from 'sparklet/main/services/note/io/note-io.js';
import type { Note } from 'sparklet/shared/types/note/notes.js';

/** Outcome of handling a corrupt note json [处理损坏笔记 json 的结果] */
export type CorruptRepairOutcome = 'valid' | 'repaired' | 'quarantined' | 'failed';

/** Check whether the note json parses and carries an id [检查笔记 json 可解析且带 id] */
export async function isNoteJsonValid(jsonPath: string): Promise<boolean> {
  try {
    const meta = await fs.readJson(jsonPath);
    return Boolean(meta && typeof meta === 'object' && meta.id);
  } catch {
    return false;
  }
}

/**
 * Handle one corrupt note json: repair from the newest snapshot, else quarantine
 * [处理一份损坏的笔记 json：有最新快照则重建，否则隔离]
 */
export async function repairOrQuarantineNote(
  notesDir: string,
  id: string,
  jsonPath: string,
  fileName: string
): Promise<CorruptRepairOutcome> {
  console.warn(`[NoteIntegrity] corrupt note json detected: ${fileName}`);
  const snapshot = await getLatestSnapshot(id);
  if (snapshot && snapshot.note) {
    // Rebuild both files from the snapshot [从快照重建两个文件]
    const note: Note = { ...snapshot.note, updatedAt: snapshot.note.updatedAt || snapshot.savedAt };
    const { content, ...meta } = note;
    await writeFileAtomic(jsonPath, JSON.stringify(meta, null, 2));
    await writeFileAtomic(path.join(notesDir, `${id}.md`), content || '');
    console.log(`[NoteIntegrity] repaired note ${id} from snapshot ${snapshot.ts}`);
    return 'repaired';
  }

  // No snapshot: quarantine so it is visible instead of silently skipped
  // [无快照：隔离，使其可见而非被静默跳过]
  try {
    await fs.rename(jsonPath, `${jsonPath}.corrupt`);
    console.warn(`[NoteIntegrity] quarantined ${fileName} -> ${fileName}.corrupt (no snapshot)`);
    return 'quarantined';
  } catch (err) {
    console.warn(`[NoteIntegrity] quarantine failed for ${fileName}:`, err);
    return 'failed';
  }
}
