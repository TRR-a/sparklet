// Note history: newest snapshot lookup [笔记历史 - 最新快照查询]

import { listSnapshotTs } from './note-history-store.js';
import { getSnapshot } from './note-history-snapshot-read.js';
import type { NoteSnapshot } from 'sparklet/shared/types/note/notes.js';

/**
 * Get the newest snapshot of a note (used by integrity repair) [获取某笔记最新快照 (完整性修复用)]
 */
export async function getLatestSnapshot(id: string): Promise<NoteSnapshot | null> {
  try {
    const tokens = await listSnapshotTs(id);
    if (tokens.length === 0) return null;
    const result = await getSnapshot(id, tokens[0]);
    return result.success && result.snapshot ? result.snapshot : null;
  } catch {
    return null;
  }
}
