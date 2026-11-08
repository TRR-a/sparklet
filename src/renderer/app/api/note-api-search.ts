// Note API: search call [笔记 API - 搜索]

import { bus } from 'sparklet/renderer/shared/ipc/ipc-bus.js';
import type { NoteSearchResult } from 'sparklet/shared/types/note/notes.js';

export const noteSearchApi = {
  search(query: string): Promise<NoteSearchResult> {
    return bus.invoke<NoteSearchResult>('notes:search', query);
  },
};
