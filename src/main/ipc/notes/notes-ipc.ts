// Notes IPC handlers [笔记 IPC 处理器]
// Handles note CRUD operations: list, get, save, delete, restore, permanentDelete, search,
// plus version history and startup integrity report [处理笔记增删改查、全文搜索、版本历史与启动完整性报告]
//
// Split out [已拆分]：CRUD → notes-ipc-crud.ts, history → notes-ipc-history.ts,
// integrity report → notes-ipc-integrity.ts.

import { registerNotesCrudIpc } from 'sparklet/main/ipc/notes/notes-ipc-crud.js';
import { registerNotesHistoryIpc } from 'sparklet/main/ipc/notes/notes-ipc-history.js';
import { registerNotesIntegrityIpc } from 'sparklet/main/ipc/notes/notes-ipc-integrity.js';

/**
 * Register all notes IPC handlers [注册所有笔记 IPC 处理器]
 */
export function registerNotesIpcHandlers(): void {
  registerNotesCrudIpc();
  registerNotesHistoryIpc();
  registerNotesIntegrityIpc();
}
