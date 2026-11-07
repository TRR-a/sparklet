// Note history: write a full snapshot + prune [笔记历史 - 写入全量快照并修剪]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getNoteHistoryDir } from './note-paths';
import {
  listSnapshotTs,
  lastSnapshotAt,
  makeTsToken,
  MAX_SNAPSHOTS_PER_NOTE,
} from './note-history-ts';
import type { Note, NoteSnapshot } from 'sparklet/shared/types/notes';

/**
 * Write a full snapshot of the note and prune old ones [写入全量快照并修剪旧快照]
 */
export async function snapshotNote(note: Note): Promise<string> {
  const ts = makeTsToken();
  const snapshot: NoteSnapshot = { ts, savedAt: new Date().toISOString(), note };
  const dir = getNoteHistoryDir(note.id);
  await fs.ensureDir(dir);
  await fs.writeJson(path.join(dir, `${ts}.json`), snapshot, { spaces: 2 });
  lastSnapshotAt.set(note.id, Date.now());

  // Prune oldest beyond the cap [超出上限时修剪最旧的]
  const all = await listSnapshotTs(note.id);
  if (all.length > MAX_SNAPSHOTS_PER_NOTE) {
    for (const old of all.slice(MAX_SNAPSHOTS_PER_NOTE)) {
      try { await fs.remove(path.join(dir, `${old}.json`)); } catch { /* ignore [忽略] */ }
    }
  }
  return ts;
}
