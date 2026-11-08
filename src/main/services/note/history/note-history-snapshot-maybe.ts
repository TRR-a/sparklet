// Note history: interval-gated snapshot on save [笔记历史 - 保存时节流快照]

import { snapshotNote } from 'sparklet/main/services/note/history/note-history-snapshot-write.js';
import { lastSnapshotAt, SNAPSHOT_INTERVAL_MS } from 'sparklet/main/services/note/history/note-history-ts.js';
import type { Note } from 'sparklet/shared/types/note/notes.js';

/**
 * Take a snapshot only if the interval elapsed since the last one (called on every save)
 * [仅当距上次快照超过间隔时才快照 (每次保存时调用)]
 */
export async function maybeSnapshotOnSave(note: Note): Promise<void> {
  const last = lastSnapshotAt.get(note.id) ?? 0;
  if (Date.now() - last < SNAPSHOT_INTERVAL_MS) return;
  await snapshotNote(note);
}
