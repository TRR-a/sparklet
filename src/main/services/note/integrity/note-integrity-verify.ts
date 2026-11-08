// Note integrity: per-note verification [笔记完整性 - 逐笔记校验]

import * as path from 'path';
import type { NoteIntegrityReport } from 'sparklet/shared/types/note/notes.js';
import { isNoteJsonValid, repairOrQuarantineNote } from './note-integrity-repair.js';

/** Verify each note .json and repair/quarantine the corrupt ones [校验每个笔记 .json，修复或隔离损坏项] */
export async function verifyNoteFiles(
  notesDir: string,
  entries: Array<{ isFile(): boolean; name: string }>,
  report: NoteIntegrityReport
): Promise<void> {
  // Verify each note .json parses [校验每个笔记 .json 可解析]
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const id = entry.name.replace('.json', '');
    const jsonPath = path.join(notesDir, entry.name);

    if (await isNoteJsonValid(jsonPath)) continue;

    const outcome = await repairOrQuarantineNote(notesDir, id, jsonPath, entry.name);
    if (outcome === 'repaired') report.repairedNotes++;
    if (outcome === 'quarantined') report.quarantinedNotes.push(id);
  }
}
