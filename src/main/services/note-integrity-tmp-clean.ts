// Note integrity: leftover temp file cleanup [笔记完整性 - 残留临时文件清理]

import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Remove leftover atomic-write temp files (*.tmp) [清理原子写入残留的临时文件 (*.tmp)]
 * @returns Number of removed files [删除的文件数]
 */
export async function cleanTmpFiles(notesDir: string, names: string[]): Promise<number> {
  let cleaned = 0;
  for (const name of names) {
    try {
      await fs.remove(path.join(notesDir, name));
      cleaned++;
    } catch (err) {
      console.warn(`[NoteIntegrity] failed to remove tmp file ${name}:`, err);
    }
  }
  return cleaned;
}
