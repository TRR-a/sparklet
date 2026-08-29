// Note module renderer-side API [note 模块渲染侧 API]
// Talks to the main process through the core IPC bus instead of a hard-coded preload bridge [经核心 IPC 总线与主进程通信，而非写死的 preload 桥]

import { bus } from '../../../src/renderer/core/ipc-bus';
import type {
  Note,
  NoteListResult,
  NoteGetResult,
  NoteSaveResult,
  NoteOperationResult,
} from '../../../src/shared/types/notes';

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
};
