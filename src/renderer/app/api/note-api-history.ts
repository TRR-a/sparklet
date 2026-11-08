// Note API: history calls [笔记 API - 历史与快照]

import { bus } from 'sparklet/renderer/shared/ipc/ipc-bus.js';
import type {
  NoteHistoryResult,
  NoteSnapshotResult,
  NoteSaveResult,
} from 'sparklet/shared/types/note/notes.js';

export const noteHistoryApi = {
  history(id: string): Promise<NoteHistoryResult> {
    return bus.invoke<NoteHistoryResult>('notes:history', id);
  },
  getSnapshot(id: string, ts: string): Promise<NoteSnapshotResult> {
    return bus.invoke<NoteSnapshotResult>('notes:history:snapshot', id, ts);
  },
  restoreSnapshot(id: string, ts: string): Promise<NoteSaveResult> {
    return bus.invoke<NoteSaveResult>('notes:history:restore', id, ts);
  },
  clearAllHistory(): Promise<{ success: boolean; count: number; error?: string }> {
    return bus.invoke('notes:history:clearAll');
  },
};
