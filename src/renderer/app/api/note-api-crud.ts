// Note API: CRUD calls [笔记 API - 增删改查]

import { bus } from 'sparklet/renderer/shared/ipc/ipc-bus.js';
import type {
  Note,
  NoteListResult,
  NoteGetResult,
  NoteSaveResult,
  NoteOperationResult,
} from 'sparklet/shared/types/notes.js';

export const noteCrudApi = {
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
