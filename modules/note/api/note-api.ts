// Note module renderer-side API [note 模块渲染侧 API]
// Talks to the main process through the core IPC bus instead of a hard-coded preload bridge [经核心 IPC 总线与主进程通信，而非写死的 preload 桥]

import { bus } from '../../../src/renderer/core/ipc-bus.js';
import type {
  Note,
  NoteListResult,
  NoteGetResult,
  NoteSaveResult,
  NoteOperationResult,
  NoteSearchResult,
  NoteHistoryResult,
  NoteSnapshotResult,
  NoteIntegrityReportResult,
} from '../../../src/shared/types/notes.js';

export const noteApi = {
  list(): Promise<NoteListResult> {
    return bus.invoke<NoteListResult>('notes:list');
  },
  get(id: string): Promise<NoteGetResult> {
    return bus.invoke<NoteGetResult>('notes:get', id);
  },
  save(note: Note): Promise<NoteSaveResult> {
    return bus.invoke<NoteSaveResult>('notes:save', note);
  },
  delete(id: string): Promise<NoteOperationResult> {
    return bus.invoke<NoteOperationResult>('notes:delete', id);
  },
  restore(id: string): Promise<NoteOperationResult> {
    return bus.invoke<NoteOperationResult>('notes:restore', id);
  },
  permanentDelete(id: string): Promise<NoteOperationResult> {
    return bus.invoke<NoteOperationResult>('notes:permanentDelete', id);
  },
  search(query: string): Promise<NoteSearchResult> {
    return bus.invoke<NoteSearchResult>('notes:search', query);
  },
  history(id: string): Promise<NoteHistoryResult> {
    return bus.invoke<NoteHistoryResult>('notes:history', id);
  },
  getSnapshot(id: string, ts: string): Promise<NoteSnapshotResult> {
    return bus.invoke<NoteSnapshotResult>('notes:history:snapshot', id, ts);
  },
  restoreSnapshot(id: string, ts: string): Promise<NoteSaveResult> {
    return bus.invoke<NoteSaveResult>('notes:history:restore', id, ts);
  },
  integrityReport(): Promise<NoteIntegrityReportResult> {
    return bus.invoke<NoteIntegrityReportResult>('notes:integrity:report');
  },
};
