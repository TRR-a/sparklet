// Note API: integrity report [笔记 API - 完整性报告]

import { bus } from 'sparklet/renderer/shared/ipc/ipc-bus.js';
import type { NoteIntegrityReportResult } from 'sparklet/shared/types/notes.js';

export const noteIntegrityApi = {
  integrityReport(): Promise<NoteIntegrityReportResult> {
    return bus.invoke<NoteIntegrityReportResult>('notes:integrity:report');
  },
};
