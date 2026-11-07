// Notes IPC: CRUD channels [笔记 IPC - 增删改查通道]

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
import type { Note } from 'sparklet/shared/types/notes';

/** Register note CRUD IPC handlers [注册笔记增删改查 IPC 处理器] */
export function registerNotesCrudIpc(): void {
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
}
