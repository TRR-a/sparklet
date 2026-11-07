// Note history: interval-gated snapshot on save [笔记历史 - 保存时节流快照]

import { snapshotNote } from './note-history-snapshot-write';
import { lastSnapshotAt, SNAPSHOT_INTERVAL_MS } from './note-history-ts';
import type { Note } from 'sparklet/shared/types/notes';

/**
 * Take a snapshot only if the interval elapsed since the last one (called on every save)
 * [仅当距上次快照超过间隔时才快照 (每次保存时调用)]
 */
export async function maybeSnapshotOnSave(note: Note): Promise<void> {
  const last = lastSnapshotAt.get(note.id) ?? 0;
  if (Date.now() - last < SNAPSHOT_INTERVAL_MS) return;
  await snapshotNote(note);
}
