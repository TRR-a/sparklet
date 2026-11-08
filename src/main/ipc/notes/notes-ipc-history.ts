// Notes IPC: version history channels [笔记 IPC - 版本历史通道]

import { ipcMain } from 'electron';
import { listHistory, getSnapshot, snapshotNote, clearAllHistory } from 'sparklet/main/services/note/io/note-history.js';
import { getNote, saveNote } from 'sparklet/main/services/note/io/notes-service.js';
import { isValidNoteId, isValidSnapshotTs } from 'sparklet/main/services/note/io/note-paths.js';
import type { Note } from 'sparklet/shared/types/note/notes.js';

/** Register note history IPC handlers [注册笔记历史 IPC 处理器] */
export function registerNotesHistoryIpc(): void {
  // 8. List version history of a note (newest first) [列出笔记版本历史 (时间降序)]
  ipcMain.handle('notes:history', async (_event, id: string) => {
    return listHistory(id);
  });

  // 9. Read one snapshot [读取一份快照]
  ipcMain.handle('notes:history:snapshot', async (_event, id: string, ts: string) => {
    return getSnapshot(id, ts);
  });

  // 10. Restore a snapshot [恢复一份快照]
  // Orchestration: snapshot current state first (restore is itself reversible), then
  // save the snapshot content back with a fresh updatedAt [编排：先快照当前状态 (恢复本身
  // 可再撤销)，再以最新时间戳把快照内容写回]
  ipcMain.handle('notes:history:restore', async (_event, id: string, ts: string) => {
    if (!isValidNoteId(id) || !isValidSnapshotTs(ts)) {
      return { success: false, error: 'Invalid parameters' };
    }
    const snap = await getSnapshot(id, ts);
    if (!snap.success || !snap.snapshot) {
      return { success: false, error: snap.error || 'Snapshot not found' };
    }
    try {
      const current = await getNote(id);
      if (current.success && current.note) await snapshotNote(current.note);
    } catch (err) {
      console.warn('[NotesIPC] pre-restore snapshot failed:', err);
    }
    const restored: Note = { ...snap.snapshot.note, updatedAt: new Date().toISOString() };
    return saveNote(restored);
  });

  // 12. Clear all note history snapshots [清空所有笔记历史快照]
  ipcMain.handle('notes:history:clearAll', async () => {
    return clearAllHistory();
  });
}
