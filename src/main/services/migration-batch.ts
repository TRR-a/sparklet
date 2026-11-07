// Migration: batch write [迁移 - 批量写入]

import type { OldNote } from './notes-service';
import { migrateOneNote } from './migration-note-write.js';

/** Migrate every old note, counting successes and failures [迁移全部旧笔记，统计成功与失败数] */
export async function migrateNoteBatch(
  notesDir: string,
  oldNotes: OldNote[]
): Promise<{ migratedCount: number; errorCount: number }> {
  let migratedCount = 0;
  let errorCount = 0;

  for (const note of oldNotes) {
    try {
      const written = await migrateOneNote(notesDir, note);
      if (written) migratedCount++;
    } catch {
      errorCount++;
    }
  }

  return { migratedCount, errorCount };
}
