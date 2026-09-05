// Notes IPC handlers [笔记 IPC 处理器]
// Handles note CRUD operations: list, get, save, delete, restore, permanentDelete, search,
// plus version history and startup integrity report [处理笔记增删改查、全文搜索、版本历史与启动完整性报告]

import { ipcMain } from 'electron';
import {
  listNotes,
  getNote,
  saveNote,
  deleteNote,
  restoreNote,
  permanentDeleteNote,
  searchNotes
} from '../services/notes-service';
import { listHistory, getSnapshot, snapshotNote } from '../services/note-history';
import { getIntegrityReport } from '../services/note-integrity';
import { isValidNoteId, isValidSnapshotTs } from '../services/note-paths';
import type { Note } from '../../shared/types/notes';

/**
 * Register all notes IPC handlers [注册所有笔记 IPC 处理器]
 */
export function registerNotesIpcHandlers(): void {
  // 1. List all notes (without content) [列出所有笔记 (不含 content)]
  ipcMain.handle('notes:list', async () => {
    return listNotes();
  });

  // 2. Get a single note (with content) [获取单篇笔记 (含 content)]
  ipcMain.handle('notes:get', async (_event, id: string) => {
    return getNote(id);
  });

  // 3. Save a note (create or update) [保存笔记 (新建或更新)]
  ipcMain.handle('notes:save', async (_event, noteData: Note) => {
    return saveNote(noteData);
  });

  // 4. Soft delete (move to trash) [软删除 (移入回收站)]
  ipcMain.handle('notes:delete', async (_event, id: string) => {
    return deleteNote(id);
  });

  // 5. Restore soft-deleted note [恢复软删除]
  ipcMain.handle('notes:restore', async (_event, id: string) => {
    return restoreNote(id);
  });

  // 6. Permanently delete (physically remove .json + .md) [永久删除 (物理删除 .json + .md)]
  ipcMain.handle('notes:permanentDelete', async (_event, id: string) => {
    return permanentDeleteNote(id);
  });

  // 7. Full-text search across title + content [全文搜索标题与正文]
  ipcMain.handle('notes:search', async (_event, query: string) => {
    return searchNotes(query);
  });

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

  // 11. Startup integrity scan report (for renderer toast) [启动完整性扫描报告 (供渲染层提示)]
  ipcMain.handle('notes:integrity:report', async () => {
    return getIntegrityReport();
  });
}
