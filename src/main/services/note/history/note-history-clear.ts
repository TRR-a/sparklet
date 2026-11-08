// Note history: cleanup (per-note / global) [笔记历史 - 清理 (按笔记/全局)]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getNoteHistoryDir } from 'sparklet/main/services/note/io/note-paths.js';
import { lastSnapshotAt } from 'sparklet/main/services/note/history/note-history-store.js';

/**
 * Remove all history of a note (on permanent delete) [移除某笔记的全部历史 (永久删除时)]
 */
export async function removeHistory(id: string): Promise<void> {
  try {
    const dir = getNoteHistoryDir(id);
    if (await fs.pathExists(dir)) await fs.remove(dir);
    lastSnapshotAt.delete(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[NoteHistory] remove failed for ${id}:`, msg);
  }
}

/**
 * Clear ALL note history (every note's snapshot directory) [清空所有笔记历史]
 * Used by settings "Clear history" action [设置页"清空历史"功能调用]
 */
export async function clearAllHistory(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const historyRoot = path.join(getNoteHistoryDir('x'), '..'); // notes/.history
    let count = 0;
    if (await fs.pathExists(historyRoot)) {
      const subdirs = await fs.readdir(historyRoot);
      count = subdirs.length;
      await fs.remove(historyRoot);
    }
    lastSnapshotAt.clear();
    return { success: true, count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: msg };
  }
}
